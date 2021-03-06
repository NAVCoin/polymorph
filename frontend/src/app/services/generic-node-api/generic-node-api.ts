import { Injectable } from '@angular/core'
import { Http, Response } from '@angular/http'

import { Observable } from 'rxjs/Rx'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/map'

import { nodeApiBaseUrl } from "../config"


@Injectable()
export class GenericNodeApiService {

  baseApiUrl: string = nodeApiBaseUrl

  constructor(private http: Http) { }

  getRequest(apiRouteUrl): Observable<any> {
    return this.http.get(this.baseApiUrl + apiRouteUrl)
                    .map(this.extractData)
                    .catch(this.handleError)
  }

  private extractData(res: Response) {
    try{
      let body = res.json()
      return body.result || body
    } catch (error) {
      console.error('Error extracting api data: ' + error )
      return ['Error']
    }
  }

  private handleError (error: Response | any) {
    let errMsg: string
    if (error instanceof Response) {
      const body = error.json() || ''
      const err = body.error || JSON.stringify(body)
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`
    } else {
      errMsg = error.message ? error.message : error.toString()
    }
    return Observable.throw(errMsg)
  }
}
