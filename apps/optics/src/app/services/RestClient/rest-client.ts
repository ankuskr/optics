import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'apps/optics/src/environments/environment';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RestClient {
  private http = inject(HttpClient);

  // Generic POST method
  post<T>(url: string, postData: any): Observable<T> {
    return this.http
      .post<T>(`${environment.apiUrl}${url}`, postData)
      .pipe(catchError(this.handleError));
  }

  // Generic GET method
  get<T>(url: string, params?: { [key: string]: any }): Observable<T> {
    const httpParams = new HttpParams({ fromObject: params || {} });
    return this.http
      .get<T>(`${environment.apiUrl}${url}`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  // Generic PUT method
  put<T>(url: string, body: any): Observable<T> {
    return this.http
      .put<T>(`${environment.apiUrl}${url}`, body)
      .pipe(catchError(this.handleError));
  }

  // Generic DELETE method
  delete<T>(url: string): Observable<T> {
    return this.http
      .delete<T>(`${environment.apiUrl}${url}`)
      .pipe(catchError(this.handleError));
  }

  // Generic PATCH method (optional addition)
  patch<T>(url: string, body: any): Observable<T> {
    return this.http
      .patch<T>(`${environment.apiUrl}${url}`, body)
      .pipe(catchError(this.handleError));
  }

  // Improved error handling with proper typing
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} - ${error.message}`;

      // Check if the server returned a custom error message
      if (error.error && typeof error.error === 'object') {
        const serverError = error.error as {
          message?: string;
          success?: boolean;
        };
        errorMessage = serverError.message || errorMessage;
      }
    }

    console.error('HTTP Error:', error);

    return throwError(() => ({
      success: false,
      message: errorMessage,
      status: error.status,
      originalError: error,
    }));
  }
}
