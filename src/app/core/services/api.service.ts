import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Options for configuring HTTP requests in ApiService.
 */
export interface ApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  withCredentials?: boolean;
}

/**
 * Enterprise generic API service handling all application HTTP communications.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Helper utility resolving relative endpoints against base environment API URL.
   *
   * @param endpoint API URL fragment or absolute URL
   * @returns Formatted target URL
   */
  private formatUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Helper utility to build HttpParams from a standard key-value object.
   *
   * @param params Key-value map of query parameters
   * @returns Configured HttpParams object
   */
  public buildHttpParams(
    params: Record<string, string | number | boolean | readonly (string | number | boolean)[] | undefined | null>
  ): HttpParams {
    let httpParams = new HttpParams();

    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          for (const item of value) {
            httpParams = httpParams.append(key, String(item));
          }
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }

    return httpParams;
  }

  /**
   * Send a GET request to the specified endpoint.
   *
   * @template T Response payload interface
   * @param endpoint API URL or path fragment
   * @param options HTTP options including params and headers
   * @returns Observable emitting the response payload
   */
  public get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<{ data: T }>(this.formatUrl(endpoint), options).pipe(
      map((res) => res.data || (res as unknown as T))
    );
  }

  /**
   * Send a POST request to the specified endpoint.
   *
   * @template T Response payload interface
   * @template U Request body payload interface
   * @param endpoint API URL or path fragment
   * @param body Request body payload
   * @param options HTTP options
   * @returns Observable emitting the response payload
   */
  public post<T, U = unknown>(endpoint: string, body: U, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<{ data: T }>(this.formatUrl(endpoint), body, options).pipe(
      map((res) => res.data || (res as unknown as T))
    );
  }

  /**
   * Send a PUT request to the specified endpoint.
   *
   * @template T Response payload interface
   * @template U Request body payload interface
   * @param endpoint API URL or path fragment
   * @param body Request body payload
   * @param options HTTP options
   * @returns Observable emitting the response payload
   */
  public put<T, U = unknown>(endpoint: string, body: U, options?: ApiRequestOptions): Observable<T> {
    return this.http.put<{ data: T }>(this.formatUrl(endpoint), body, options).pipe(
      map((res) => res.data || (res as unknown as T))
    );
  }

  /**
   * Send a PATCH request to the specified endpoint.
   *
   * @template T Response payload interface
   * @template U Request body payload interface
   * @param endpoint API URL or path fragment
   * @param body Request body payload
   * @param options HTTP options
   * @returns Observable emitting the response payload
   */
  public patch<T, U = unknown>(endpoint: string, body: U, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<{ data: T }>(this.formatUrl(endpoint), body, options).pipe(
      map((res) => res.data || (res as unknown as T))
    );
  }

  /**
   * Send a DELETE request to the specified endpoint.
   *
   * @template T Response payload interface
   * @param endpoint API URL or path fragment
   * @param options HTTP options
   * @returns Observable emitting the response payload
   */
  public delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<{ data: T }>(this.formatUrl(endpoint), options).pipe(
      map((res) => res.data || (res as unknown as T))
    );
  }

  /**
   * Upload a File payload using multipart/form-data.
   *
   * @template T Response payload interface
   * @param endpoint API URL or path fragment
   * @param file Target File object to upload
   * @param additionalFields Optional extra form data key-value fields
   * @returns Observable emitting the upload response
   */
  public uploadFile<T>(
    endpoint: string,
    file: File,
    additionalFields?: Record<string, string | Blob>
  ): Observable<T> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    if (additionalFields) {
      for (const [key, value] of Object.entries(additionalFields)) {
        formData.append(key, value);
      }
    }

    return this.http.post<{ data: T }>(this.formatUrl(endpoint), formData).pipe(
      map((res) => res.data || (res as unknown as T))
    );
  }
}
