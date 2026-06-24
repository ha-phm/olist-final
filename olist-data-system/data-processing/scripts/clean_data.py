# -*- coding: utf-8 -*-
"""
Olist E-commerce Data Cleaning and PostgreSQL Pipeline
Using Python & Pandas to read, clean, and prepare Olist datasets.
"""

import os
import pandas as pd
import numpy as np

def clean_and_process_data(data_dir="raw_data", output_dir="cleaned_data"):
    print("--- Starting Olist Data Cleaning Pipeline ---")
    
    # Create output directory for clean files
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")
        
    # 1. Clean Customers
    print("Processing olist_customers_dataset.csv...")
    cust_df = pd.read_csv(os.path.join(data_dir, "olist_customers_dataset.csv"))
    # Fill any empty cells or normalize text
    cust_df['customer_city'] = cust_df['customer_city'].str.title().str.strip()
    cust_df['customer_state'] = cust_df['customer_state'].str.upper().str.strip()
    # Save clean
    cust_df.to_csv(os.path.join(output_dir, "clean_customers.csv"), index=False)
    
    # 2. Clean Products
    print("Processing olist_products_dataset.csv...")
    prod_df = pd.read_csv(os.path.join(data_dir, "olist_products_dataset.csv"))
    # Handlers for nulls in descriptions, dimensions etc.
    prod_df['product_category_name'] = prod_df['product_category_name'].fillna('outros')
    prod_df['product_name_lenght'] = prod_df['product_name_lenght'].fillna(0).astype(int)
    prod_df['product_description_lenght'] = prod_df['product_description_lenght'].fillna(0).astype(int)
    prod_df['product_photos_qty'] = prod_df['product_photos_qty'].fillna(0).astype(int)
    prod_df['product_weight_g'] = prod_df['product_weight_g'].fillna(0)
    # Save clean
    prod_df.to_csv(os.path.join(output_dir, "clean_products.csv"), index=False)

    # 3. Clean Category Translation
    print("Processing product_category_name_translation.csv...")
    trans_df = pd.read_csv(os.path.join(data_dir, "product_category_name_translation.csv"))
    trans_df.to_csv(os.path.join(output_dir, "clean_translations.csv"), index=False)

    # 4. Clean Sellers
    print("Processing olist_sellers_dataset.csv...")
    sel_df = pd.read_csv(os.path.join(data_dir, "olist_sellers_dataset.csv"))
    sel_df['seller_city'] = sel_df['seller_city'].str.title().str.strip()
    sel_df['seller_state'] = sel_df['seller_state'].str.upper().str.strip()
    sel_df.to_csv(os.path.join(output_dir, "clean_sellers.csv"), index=False)

    # 5. Clean Orders
    print("Processing olist_orders_dataset.csv...")
    orders_df = pd.read_csv(os.path.join(data_dir, "olist_orders_dataset.csv"))
    # Standardize date types
    date_cols = [
        'order_purchase_timestamp', 'order_approved_at', 
        'order_delivered_carrier_date', 'order_delivered_customer_date', 
        'order_estimated_delivery_date'
    ]
    for col in date_cols:
        orders_df[col] = pd.to_datetime(orders_df[col], errors='coerce')
    # Fill order approved timestamp with purchase timestamp if missing
    orders_df['order_approved_at'] = orders_df['order_approved_at'].fillna(orders_df['order_purchase_timestamp'])
    # Save clean
    orders_df.to_csv(os.path.join(output_dir, "clean_orders.csv"), index=False)

    # 6. Clean Order Items
    print("Processing olist_order_items_dataset.csv...")
    items_df = pd.read_csv(os.path.join(data_dir, "olist_order_items_dataset.csv"))
    items_df['shipping_limit_date'] = pd.to_datetime(items_df['shipping_limit_date'], errors='coerce')
    items_df.to_csv(os.path.join(output_dir, "clean_order_items.csv"), index=False)

    # 7. Clean Payments
    print("Processing olist_order_payments_dataset.csv...")
    payments_df = pd.read_csv(os.path.join(data_dir, "olist_order_payments_dataset.csv"))
    payments_df.to_csv(os.path.join(output_dir, "clean_payments.csv"), index=False)

    # 8. Clean Reviews
    print("Processing olist_order_reviews_dataset.csv...")
    reviews_df = pd.read_csv(os.path.join(data_dir, "olist_order_reviews_dataset.csv"))
    reviews_df['review_comment_title'] = reviews_df['review_comment_title'].fillna('')
    reviews_df['review_comment_message'] = reviews_df['review_comment_message'].fillna('')
    reviews_df['review_creation_date'] = pd.to_datetime(reviews_df['review_creation_date'], errors='coerce')
    reviews_df['review_answer_timestamp'] = pd.to_datetime(reviews_df['review_answer_timestamp'], errors='coerce')
    reviews_df.to_csv(os.path.join(output_dir, "clean_reviews.csv"), index=False)

    # 9. Clean Geolocation
    print("Processing olist_geolocation_dataset.csv...")
    geo_df = pd.read_csv(os.path.join(data_dir, "olist_geolocation_dataset.csv"))
    geo_df['geolocation_city'] = geo_df['geolocation_city'].str.title().str.strip()
    geo_df['geolocation_state'] = geo_df['geolocation_state'].str.upper().str.strip()
    # Deduplicate geolocation on zip code prefix to save DB index size
    geo_df_dedup = geo_df.drop_duplicates(subset=['geolocation_zip_code_prefix'])
    geo_df_dedup.to_csv(os.path.join(output_dir, "clean_geolocation.csv"), index=False)

    print("--- Olist Cleaning Completed Successfully! ---")
    print(f"Cleaned files exported to: '{output_dir}/'")

def export_to_postgresql(postgres_uri):
    """
    Optional DB Loader pipeline.
    Connects to Postgres database using SQLAlchemy and writes clean dataframes.
    """
    try:
        from sqlalchemy import create_engine
        engine = create_engine(postgres_uri)
        
        # Load and upload clean data (ĐÃ BỔ SUNG ĐẦY ĐỦ 9 BẢNG)
        datafiles = {
            "customers": "clean_customers.csv",
            "products": "clean_products.csv",
            "category_translations": "clean_translations.csv",  # <-- Bảng được bổ sung
            "sellers": "clean_sellers.csv",
            "orders": "clean_orders.csv",
            "order_items": "clean_order_items.csv",
            "order_payments": "clean_payments.csv",
            "order_reviews": "clean_reviews.csv",
            "geolocation": "clean_geolocation.csv"
        }
        
        print(f"Connecting to PostgreSQL database: {postgres_uri}")
        for table, filepath in datafiles.items():
            full_path = os.path.join("cleaned_data", filepath)
            if os.path.exists(full_path):
                df = pd.read_csv(full_path)
                print(f"Pushing table '{table}' ({len(df)} rows) to PostgreSQL...")
                df.to_sql(f"olist_{table}", con=engine, if_exists="replace", index=False)
                print(f"Table '{table}' uploaded.")
        print("--- Database load completed! ---")
    except Exception as e:
        print(f"Error loading to Postgres: {e}")

if __name__ == "__main__":
    # Đường dẫn tuyệt đối đến thư mục chứa CSV gốc
    RAW_DATA_DIR = r"D:\olist-data-hub-system\olist-data-system\data-processing\raw_data"
    
    # Bước 1: Clean data
    clean_and_process_data(data_dir=RAW_DATA_DIR)
    
    # Bước 2: Push lên PostgreSQL
    DB_URI = "postgresql://postgres:0354959546@localhost:5432/olist_db"
    export_to_postgresql(DB_URI)