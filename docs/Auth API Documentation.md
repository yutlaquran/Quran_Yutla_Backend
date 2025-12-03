

This document provides a detailed specification for the API endpoints related to authentication and user management.

## 1. User Login

- **Endpoint:** `POST /api/v1/auth/login`
    
- **Method:** `POST`
    
- **Description:** Authenticates a user and returns access and refresh tokens upon successful login.
    

#### Request Body

``` 
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

|   |   |   |
|---|---|---|
|**Field**|**Type**|**Description**|
|`email`|String|The user's email address.|
|`password`|String|The user's password.|

## 2. Student Sign-Up

- **Endpoint:** `POST /api/v1/auth/sign-up`
    
- **Method:** `POST`
    
- **Description:** Registers a new student user and sends a verification OTP to their email.
    

#### Request Body

```
{
  "email": "student@example.com",
  "password": "strongpassword123",
  "confirmPassword": "strongpassword123",
  "phoneNumber": "+1234567890"
}
```

|   |   |   |
|---|---|---|
|**Field**|**Type**|**Description**|
|`email`|String|The new user's email address.|
|`password`|String|The new user's password.|
|`confirmPassword`|String|Password confirmation. Must match `password`.|
|`phoneNumber`|String|The user's phone number.|

#### Success Response (200 OK)

Returns the newly created user's basic information. An OTP is sent to the provided email address for verification.

```
{
  "statusCode": 200,
  "message": "auth.SIGNUP_SUCCESSFUL",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "phoneNumber": "+1234567890"
    }
  }
}
```

## 3. Get Current User

- **Endpoint:** `GET /api/v1/auth/get-me`
    
- **Method:** `GET`
    
- **Description:** Retrieves the profile information of the currently authenticated user.
    
- **Authentication:** **Required**. A valid `accessToken` must be provided in the `Authorization` header as a Bearer token.
    

#### Request Headers

```
Authorization: Bearer <accessToken>
```

#### Success Response (200 OK)

```
{
  "statusCode": 200,
  "message": "auth.USER_INFO_RETRIEVED",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "phoneNumber": "+1234567890",
    "roles": ["student"]
  }
}
```

#### Error Response (401 Unauthorized)

```
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## 4. Refresh Token

- **Endpoint:** `POST /api/v1/auth/refresh-token`
    
- **Method:** `POST`
    
- **Description:** Generates a new `accessToken` and `refreshToken` using a valid `refreshToken`.
    

#### Request Body

```
{
  "refreshToken": "ey..."
}
```

|   |   |   |
|---|---|---|
|**Field**|**Type**|**Description**|
|`refreshToken`|String|The user's valid refresh token.|

#### Success Response (200 OK)

```
{
  "statusCode": 200,
  "message": "auth.TOKEN_REFRESHED",
  "data": {
    "accessToken": "new_ey...",
    "refreshToken": "new_ey..."
  }
}
```

## 5. Logout

- **Endpoint:** `POST /api/v1/auth/logout`
    
- **Method:** `POST`
    
- **Description:** Logs the user out by invalidating the provided refresh token.
    
- **Authentication:** **Required**. A valid `accessToken` must be provided in the `Authorization` header.
    

#### Request Headers

```
Authorization: Bearer <accessToken>
```

#### Request Body

```
{
  "refreshToken": "ey..."
}
```

#### Success Response (200 OK)

```
{
  "statusCode": 200,
  "message": "auth.LOGOUT_SUCCESSFUL",
  "data": null
}
```

## 6. OTP & Password Management

### 6.1. Forget Password

- **Endpoint:** `POST /api/v1/auth/forget-password`
    
- **Method:** `POST`
    
- **Description:** The first step in the password reset process. It sends a verification OTP to the user's registered email.
    

#### Request Body

```
{
  "email": "user@example.com"
}
```

#### Success Response (200 OK)

```
{
  "statusCode": 200,
  "message": "auth.VERIFY_EMAIL_SUCCESSFUL",
  "data": null
}
```

### 6.2. Verify OTP

- **Endpoint:** `POST /api/v1/auth/verify-otp`
    
- **Method:** `POST`
    
- **Description:** Verifies the OTP sent to the user's email. This is used after sign-up or after requesting a password reset.
    

#### Request Body

```
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Success Response (200 OK)

Returns a token that must be used in the `update-password` step.

```
{
    "statusCode": 200,
    "message": "auth.VERIFY_EMAIL_SUCCESSFUL",
    "data": {
        "token": "verification-token..."
    }
}
```

### 6.3. Resend OTP

- **Endpoint:** `POST /api/v1/auth/resend-otp`
    
- **Method:** `POST`
    
- **Description:** Resends a new OTP to the user's email.
    

#### Request Body

```
{
  "email": "user@example.com"
}
```

#### Success Response (200 OK)

```
{
  "statusCode": 200,
  "message": "auth.VERIFY_EMAIL_SUCCESSFUL",
  "data": null
}
```

### 6.4. Update Password

- **Endpoint:** `POST /api/v1/auth/update-password`
    
- **Method:** `POST`
    
- **Description:** The final step to set a new password after successful OTP verification.
    

#### Request Body

```
{
  "token": "verification-token...",
  "password": "newStrongPassword123",
  "confirmPassword": "newStrongPassword123"
}
```

|   |   |   |
|---|---|---|
|**Field**|**Type**|**Description**|
|`token`|String|The token received from the `verify-otp` endpoint.|
|`password`|String|The new password for the user account.|
|`confirmPassword`|String|Password confirmation. Must match `password`.|

#### Success Response (200 OK)

```
{
  "statusCode": 200,
  "message": "auth.UPDATE_PASSWORD_SUCCESSFUL",
  "data": null
}
```