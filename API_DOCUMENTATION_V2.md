# Lisk TrustPay API - Hackathon

## 📋 Overview
A comprehensive Web3 Payment Gateway with Escrow System built on Lisk blockchain.

## 🔌 Base URL
```
http://localhost:3001/api/v1
```

## 🔐 Authentication
All endpoints except `/health` and `/auth/register` require a Bearer token in the Authorization header:
```
Authorization: Bearer {{jwt_token}}
```

## 🌐 Endpoints

### 🏥 Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Description**: Check if the API is running
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2025-08-30T22:45:12.123Z"
  }
  ```

### 🔐 Authentication

#### Register User
- **URL**: `/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123!",
    "username": "johndoe",
    "liskAddress": "lskdwsyfmcko6mcd357446yatromr3vcdj2f5o8m7",
    "publicKey": "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "5f8d0f3d9d5d8c3e3c9f3d5d",
        "email": "user@example.com",
        "username": "johndoe",
        "liskAddress": "lskdwsyfmcko6mcd357446yatromr3vcdj2f5o8m7"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### Login User
- **URL**: `/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123!"
  }
  ```
- **Success Response (200)**: Same as register response

#### Get User Profile
- **URL**: `/auth/profile`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "5f8d0f3d9d5d8c3e3c9f3d5d",
        "email": "user@example.com",
        "username": "johndoe",
        "liskAddress": "lskdwsyfmcko6mcd357446yatromr3vcdj2f5o8m7",
        "publicKey": "5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09"
      }
    }
  }
  ```

### 💰 Escrow System

#### Create Escrow
- **URL**: `/escrow`
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "sellerId": "SELLER_USER_ID",
    "amount": "5000000000",
    "description": "MacBook Pro 2023 - 16 inch, M2 Max, 32GB RAM",
    "terms": "Product must be delivered within 5 business days.",
    "productInfo": {
      "name": "MacBook Pro 2023",
      "description": "16 inch MacBook Pro with M2 Max chip",
      "category": "Electronics"
    },
    "autoReleaseHours": 120
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "data": {
      "escrow": {
        "escrowId": "esc_1234567890",
        "status": "created",
        "amount": "5000000000",
        "buyerId": "BUYER_ID",
        "sellerId": "SELLER_ID",
        "createdAt": "2025-08-30T22:45:12.123Z"
      }
    }
  }
  ```

#### Get Escrow Details
- **URL**: `/escrow/:escrowId`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "escrow": {
        "escrowId": "esc_1234567890",
        "status": "funded",
        "amount": "5000000000",
        "buyerId": "BUYER_ID",
        "sellerId": "SELLER_ID",
        "createdAt": "2025-08-30T22:45:12.123Z",
        "fundedAt": "2025-08-30T22:46:30.456Z"
      }
    }
  }
  ```

#### Fund Escrow
- **URL**: `/escrow/:escrowId/fund`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Escrow funded successfully",
    "data": {
      "transactionId": "tx_1234567890"
    }
  }
  ```

#### Release Escrow
- **URL**: `/escrow/:escrowId/release`
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "reason": "Product received in perfect condition"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Funds released to seller",
    "data": {
      "transactionId": "tx_0987654321"
    }
  }
  ```

## 🔄 Workflow Example

### 1. Buyer creates an escrow
```http
POST /api/v1/escrow
Authorization: Bearer {{buyer_token}}
Content-Type: application/json

{
  "sellerId": "{{seller_id}}",
  "amount": "1000000000",
  "description": "iPhone 15 Pro Max - 256GB",
  "terms": "7-day return policy"
}
```

### 2. Buyer funds the escrow
```http
POST /api/v1/escrow/{{escrow_id}}/fund
Authorization: Bearer {{buyer_token}}
```

### 3. Seller ships the product
(No API call - physical action)

### 4. Buyer confirms receipt and releases funds
```http
POST /api/v1/escrow/{{escrow_id}}/release
Authorization: Bearer {{buyer_token}}
Content-Type: application/json

{
  "reason": "Item received as described"
}
```

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": ["Email is required"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Escrow not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration time | `24h` |
| `LISK_NETWORK` | Lisk network to connect to | `testnet` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/trustpay` |

## 📚 Additional Resources

- [Lisk Documentation](https://lisk.com/documentation/)
- [Postman Collection](./Lisk-TrustPay-API.postman_collection.json)
- [GitHub Repository](https://github.com/yourusername/trustpay-api)
