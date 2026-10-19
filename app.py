
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import random
import time
import os
app = Flask(__name__)
CORS(app)

db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "aneyk_vasthra"),
    "port": int(os.getenv("DB_PORT", "3306"))
}



def get_db_connection():
    return mysql.connector.connect(**db_config)


def error_response(message, status=400):
    return jsonify({"success": False, "error": message}), status


# ---------------- GET CATEGORIES ----------------
@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, name, slug FROM categories ORDER BY id"
        )
        categories = cursor.fetchall()

        return jsonify({
            "success": True,
            "categories": categories
        })

    except Error:
        app.logger.exception("Could not fetch categories")
        return error_response("Unable to load categories.", 500)

    finally:
        if conn and conn.is_connected():
            conn.close()


# ---------------- GET PRODUCTS ----------------
@app.route("/api/products", methods=["GET"])
def get_products():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                p.id,
                p.title,
                p.category_id,
                c.name AS category,
                c.slug AS categorySlug,
                p.fabric,
                p.price,
                p.original_price AS originalPrice,
                p.image_url AS image,
                p.description,
                p.is_featured AS featured
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            ORDER BY p.is_featured DESC, p.id
        """)

        products = cursor.fetchall()

        for product in products:
            cursor.execute("""
                SELECT size_name, stock
                FROM product_sizes
                WHERE product_id = %s
                ORDER BY id
            """, (product["id"],))

            sizes = cursor.fetchall()

            product["sizes"] = [
                size["size_name"] for size in sizes
            ]
            product["stock"] = {
                size["size_name"]: size["stock"]
                for size in sizes
            }
            product["price"] = float(product["price"])
            product["originalPrice"] = float(
                product["originalPrice"]
            )
            product["featured"] = bool(product["featured"])

        return jsonify({
            "success": True,
            "products": products
        })

    except Error:
        app.logger.exception("Could not fetch products")
        return error_response("Unable to load products.", 500)

    finally:
        if conn and conn.is_connected():
            conn.close()


# ---------------- PLACE ORDER ----------------
@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.get_json(silent=True) or {}

    customer = data.get("customer") or {}
    items = data.get("items")
    payment_method = data.get("paymentMethod")

    required_fields = [
        "name", "phone", "address",
        "pincode", "city", "state"
    ]

    if not all(
        str(customer.get(field, "")).strip()
        for field in required_fields
    ):
        return error_response("Please complete all delivery details.")

    if not isinstance(items, list) or not items:
        return error_response("Your cart is empty.")

    if payment_method not in ("COD", "UPI", "CARD"):
        return error_response("Invalid payment method.")

    conn = None

    try:
        conn = get_db_connection()
        conn.start_transaction()
        cursor = conn.cursor(dictionary=True)

        total_amount = 0
        verified_items = []

        # Verify products, prices, sizes and stock in the database.
        for item in items:
            product_id = str(item.get("id", "")).strip()
            size = str(item.get("size", "")).strip()

            try:
                quantity = int(item.get("qty", item.get("quantity", 0)))
            except (ValueError, TypeError):
                conn.rollback()
                return error_response("Invalid item quantity.")

            if not product_id or not size or quantity < 1:
                conn.rollback()
                return error_response("Invalid cart item.")

            cursor.execute("""
                SELECT p.id, p.title, p.price,
                       ps.size_name, ps.stock
                FROM products p
                JOIN product_sizes ps ON ps.product_id = p.id
                WHERE p.id = %s AND ps.size_name = %s
                FOR UPDATE
            """, (product_id, size))

            product = cursor.fetchone()

            if not product:
                conn.rollback()
                return error_response(
                    "A product or size is no longer available."
                )

            if product["stock"] < quantity:
                conn.rollback()
                return error_response(
                    f"Insufficient stock for {product['title']} ({size})."
                )

            unit_price = product["price"]
            total_amount += unit_price * quantity

            verified_items.append({
                "id": product_id,
                "size": size,
                "qty": quantity,
                "price": unit_price
            })

        order_id = (
            f"AV-{int(time.time())}-{random.randint(100, 999)}"
        )

        # Uses the actual column names in your orders table.
        cursor.execute("""
            INSERT INTO orders (
                order_id, user_id, customer_name, phone,
                address, pincode, city, state, payment_method,
                payment_status, total_amount, order_status
            )
            VALUES (
                %s, NULL, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s
            )
        """, (
            order_id,
            customer["name"].strip(),
            customer["phone"].strip(),
            customer["address"].strip(),
            customer["pincode"].strip(),
            customer["city"].strip(),
            customer["state"].strip(),
            payment_method,
            "Pending",
            total_amount,
            "Placed"
        ))

        # Uses quantity, not the old column name qty.
        for item in verified_items:
            cursor.execute("""
                INSERT INTO order_items (
                    order_id, product_id, size,
                    quantity, unit_price
                )
                VALUES (%s, %s, %s, %s, %s)
            """, (
                order_id,
                item["id"],
                item["size"],
                item["qty"],
                item["price"]
            ))

            cursor.execute("""
                UPDATE product_sizes
                SET stock = stock - %s
                WHERE product_id = %s
                  AND size_name = %s
            """, (
                item["qty"],
                item["id"],
                item["size"]
            ))

        conn.commit()

        return jsonify({
            "success": True,
            "orderId": order_id,
            "totalAmount": float(total_amount),
            "message": "Order placed successfully!"
        }), 201

    except Error:
        if conn and conn.is_connected():
            conn.rollback()

        app.logger.exception("Order creation failed")
        return error_response(
            "Unable to place your order. Please try again.", 500
        )

    finally:
        if conn and conn.is_connected():
            conn.close()


# ---------------- HEALTH CHECK ----------------
@app.route("/api/health", methods=["GET"])
def health_check():
    conn = None
    try:
        conn = get_db_connection()
        return jsonify({
            "success": True,
            "message": "An eyk Vasthra API is running."
        })
    except Error:
        return error_response("Database connection failed.", 500)
    finally:
        if conn and conn.is_connected():
            conn.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
