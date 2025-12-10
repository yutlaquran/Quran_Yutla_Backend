import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

export interface PaymobAuthResponse {
  token: string;
}

export interface PaymobOrderResponse {
  id: number;
}

export interface PaymobPaymentKeyResponse {
  token: string;
}

export interface PaymobCreatePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);
  private readonly apiKey: string;
  private readonly integrationIdCard: string;
  private readonly integrationIdWallet: string;
  private readonly hmacSecret: string;
  private readonly currency: string;
  private readonly baseUrl: string;
  private readonly iframeId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('paymob.apiKey') || '';
    this.integrationIdCard = this.configService.get<string>('paymob.integrationIdCard') || '';
    this.integrationIdWallet = this.configService.get<string>('paymob.integrationIdWallet') || '';
    this.hmacSecret = this.configService.get<string>('paymob.hmacSecret') || '';
    this.currency = this.configService.get<string>('paymob.currency') || 'EGP';
    this.baseUrl = this.configService.get<string>('paymob.baseUrl') || 'https://accept.paymob.com/api';
    this.iframeId = this.configService.get<string>('paymob.iframeId') || '';
  }

  /**
   * Step 1: Authentication - Get auth token
   */
  private async authenticate(): Promise<string> {
    try {
      const response = await axios.post<PaymobAuthResponse>(
        `${this.baseUrl}/auth/tokens`,
        {
          api_key: this.apiKey,
        },
      );

      return response.data.token;
    } catch (error) {
      this.logger.error('Paymob authentication failed', error);
      throw new BadRequestException('Payment gateway authentication failed');
    }
  }

  /**
   * Step 2: Order Registration - Create order
   */
  private async createOrder(
    authToken: string,
    orderId: string,
    amount: number,
  ): Promise<number> {
    try {
      const amountCents = Math.round(amount * 100); // Convert to cents

      const response = await axios.post<PaymobOrderResponse>(
        `${this.baseUrl}/ecommerce/orders`,
        {
          auth_token: authToken,
          delivery_needed: 'false',
          amount_cents: amountCents,
          currency: this.currency,
          merchant_order_id: orderId,
          items: [],
        },
      );

      return response.data.id;
    } catch (error) {
      this.logger.error('Paymob order creation failed', error);
      throw new BadRequestException('Payment order creation failed');
    }
  }

  /**
   * Step 3: Payment Key Request - Get payment token
   */
  private async getPaymentKey(
    authToken: string,
    paymobOrderId: number,
    amount: number,
    params: PaymobCreatePaymentParams,
    paymentMethod: 'card' | 'wallet' = 'card',
  ): Promise<string> {
    try {
      const amountCents = Math.round(amount * 100);
      const integrationId = paymentMethod === 'card' 
        ? this.integrationIdCard 
        : this.integrationIdWallet;

      const response = await axios.post<PaymobPaymentKeyResponse>(
        `${this.baseUrl}/acceptance/payment_keys`,
        {
          auth_token: authToken,
          amount_cents: amountCents,
          expiration: 3600, // 1 hour
          order_id: paymobOrderId,
          billing_data: {
            apartment: 'NA',
            email: params.email,
            floor: 'NA',
            first_name: params.firstName,
            street: 'NA',
            building: 'NA',
            phone_number: params.phone,
            shipping_method: 'NA',
            postal_code: 'NA',
            city: 'Cairo',
            country: 'EG',
            last_name: params.lastName,
            state: 'Cairo',
          },
          currency: this.currency,
          integration_id: integrationId,
        },
      );

      return response.data.token;
    } catch (error) {
      this.logger.error('Paymob payment key generation failed', error);
      throw new BadRequestException('Payment key generation failed');
    }
  }

  /**
   * Main method: Create payment and return payment URL
   */
  async createPayment(
    params: PaymobCreatePaymentParams,
    paymentMethod: 'card' | 'wallet' = 'card',
  ): Promise<{ paymentUrl: string; paymentToken: string }> {
    try {
      // Step 1: Authenticate
      const authToken = await this.authenticate();
      this.logger.log(`Paymob authenticated for order: ${params.orderId}`);

      // Step 2: Create Order
      const paymobOrderId = await this.createOrder(
        authToken,
        params.orderId,
        params.amount,
      );
      this.logger.log(`Paymob order created: ${paymobOrderId}`);

      // Step 3: Get Payment Key
      const paymentToken = await this.getPaymentKey(
        authToken,
        paymobOrderId,
        params.amount,
        params,
        paymentMethod,
      );
      this.logger.log(`Paymob payment key generated for order: ${params.orderId}`);

      // Step 4: Generate Payment URL
      const paymentUrl = this.iframeId
        ? `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`
        : `https://accept.paymob.com/api/acceptance/payment_keys/${paymentToken}`;

      return {
        paymentUrl,
        paymentToken,
      };
    } catch (error) {
      this.logger.error('Paymob payment creation failed', error);
      throw error;
    }
  }

  /**
   * Verify webhook HMAC signature
   */
  verifyWebhookSignature(data: any, receivedHmac: string): boolean {
    try {
      // Build the HMAC string according to Paymob docs
      const concatenatedString = [
        data.amount_cents,
        data.created_at,
        data.currency,
        data.error_occured,
        data.has_parent_transaction,
        data.id,
        data.integration_id,
        data.is_3d_secure,
        data.is_auth,
        data.is_capture,
        data.is_refunded,
        data.is_standalone_payment,
        data.is_voided,
        data.order?.id,
        data.owner,
        data.pending,
        data.source_data?.pan,
        data.source_data?.sub_type,
        data.source_data?.type,
        data.success,
      ].join('');

      const calculatedHmac = crypto
        .createHmac('sha512', this.hmacSecret)
        .update(concatenatedString)
        .digest('hex');

      return calculatedHmac === receivedHmac;
    } catch (error) {
      this.logger.error('HMAC verification failed', error);
      return false;
    }
  }

  /**
   * Process webhook callback from Paymob
   */
  async processWebhook(data: any): Promise<{
    success: boolean;
    orderId: string;
    transactionId: string;
    amount: number;
  }> {
    const success = data.success === 'true' || data.success === true;
    const orderId = data.order?.merchant_order_id || data.merchant_order_id;
    const transactionId = data.id?.toString();
    const amount = data.amount_cents / 100;

    this.logger.log(`Webhook processed: Order ${orderId}, Success: ${success}`);

    return {
      success,
      orderId,
      transactionId,
      amount,
    };
  }

  /**
   * Refund a transaction (if needed)
   */
  async refundTransaction(transactionId: string, amount: number): Promise<boolean> {
    try {
      const authToken = await this.authenticate();
      const amountCents = Math.round(amount * 100);

      await axios.post(
        `${this.baseUrl}/acceptance/void_refund/refund`,
        {
          auth_token: authToken,
          transaction_id: transactionId,
          amount_cents: amountCents,
        },
      );

      this.logger.log(`Refund successful for transaction: ${transactionId}`);
      return true;
    } catch (error) {
      this.logger.error('Refund failed', error);
      return false;
    }
  }
}
