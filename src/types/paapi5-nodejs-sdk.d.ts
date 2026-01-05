declare module 'paapi5-nodejs-sdk' {
  export interface ApiClient {
    accessKey: string;
    secretKey: string;
    host: string;
    region: string;
  }

  export interface GetItemsRequest {
    PartnerTag: string;
    PartnerType: string;
    ItemIds: string[];
    Resources: string[];
  }

  export interface GetItemsResponse {
    Errors?: Array<{ Message: string }>;
    ItemsResult?: {
      Items: Array<{
        ASIN: string;
        Images?: {
          Primary?: {
            Large?: { URL: string };
          };
          Variants?: Array<{
            Large?: { URL: string };
          }>;
        };
        ItemInfo?: {
          Title?: { DisplayValue: string };
          Features?: { DisplayValues: string[] };
          ByLineInfo?: any;
          ProductInfo?: any;
          TechnicalInfo?: Record<string, { DisplayValue: any }>;
        };
        Offers?: {
          Listings?: Array<{
            Price?: {
              DisplayAmount: string;
              Currency: string;
            };
            Availability?: {
              Message: string;
            };
          }>;
        };
        CustomerReviews?: {
          StarRating?: number;
          Count?: number;
        };
      }>;
    };
  }

  export class DefaultApi {
    getItems(request: GetItemsRequest, callback: (error: any, data: any) => void): void;
  }

  export class GetItemsRequest {
    constructor();
    PartnerTag: string;
    PartnerType: string;
    ItemIds: string[];
    Resources: string[];
  }

  export class GetItemsResponse {
    static constructFromObject(data: any): GetItemsResponse;
    Errors?: Array<{ Message: string }>;
    ItemsResult?: {
      Items: any[];
    };
  }

  const ApiClient: {
    instance: ApiClient;
  };

  const ProductAdvertisingAPIv1: {
    ApiClient: typeof ApiClient;
    DefaultApi: typeof DefaultApi;
    GetItemsRequest: typeof GetItemsRequest;
    GetItemsResponse: typeof GetItemsResponse;
  };

  export default ProductAdvertisingAPIv1;
}

