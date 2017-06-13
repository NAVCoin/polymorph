import { Injectable } from '@angular/core';

import { ChangellyApiService } from '../../services/changelly-api/changelly-api';
import { blankDataBundle, changellyConstData } from "../config";

import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/first';

@Injectable()
export class SendPageDataService {

  dataStored: boolean = false

  dataBundle = {
    'transferAmount': undefined,
    'originCoin': undefined,
    'destCoin': undefined,
    'destAddr': undefined,
    'estConvToNav': undefined,
    'estConvFromNav': undefined,
    'estTime': undefined,
    'changellyFeeTotalToNav': undefined,
    'navtechFeeTotal': undefined,
    'changellyFeeTotalFromNav': undefined,
    'minTransferAmount': undefined,
    'validData': false,
    'errors': {
      'invalidDestAddress': false,
      'invalidTransferAmount': false,
      'transferTooSmall': false,
      'transferTooLarge': false,
      'navToNavTransfer': false,
      'changellyError': false
    }
  }

  CHANGELLY_FEE: number = changellyConstData.CHANGELLY_FEE
  NAVTECH_FEE: number = changellyConstData.NAVTECH_FEE
  MAX_NAV_PER_TRADE: number = changellyConstData.MAX_NAV_PER_TRADE

  subject = new Subject<any>()

  isDataSet: boolean = false

  constructor(private changellyApi: ChangellyApiService) { }

  getData(): void {
    if(this.dataStored){
      this.subject.next(this.dataBundle)
    }
  }

  getDataStream(): Observable<any> {
    return this.subject.asObservable()
  }

  clearData(): void {
    this.dataBundle = Object.assign({}, blankDataBundle)
    this.isDataSet = false
    this.subject.next(this.dataBundle)
  }

  checkIsDataSet():boolean {
    return this.isDataSet
  }

  storeData(transferAmount, originCoin, destCoin, destAddr): void {
    // this.dataBundle = Object.assign({}, blankDataBundle)
    this.dataBundle.validData = true
    this.dataBundle.transferAmount = Number(transferAmount)? Number(transferAmount): undefined
    this.dataBundle.originCoin = originCoin
    this.dataBundle.destCoin = destCoin
    this.dataBundle.destAddr = destAddr
    this.dataStored = true
    if(!this.validateFormData(this.dataBundle)){
      this.subject.next(this.dataBundle)
      return //things are broken so return early
    }
    this.dataBundle.validData = true

    this.getEstimatedExchange(originCoin, 'nav', transferAmount)
      .then((data) => {
        this.dataBundle.changellyFeeTotalToNav = transferAmount - transferAmount * this.CHANGELLY_FEE
        this.dataBundle.navtechFeeTotal = data - data * this.NAVTECH_FEE
        this.dataBundle.estConvToNav = data - this.dataBundle.navtechFeeTotal

        this.getEstimatedExchange('nav', destCoin, transferAmount)
        .then((data) => {
          this.dataBundle.changellyFeeTotalFromNav = data * this.CHANGELLY_FEE
          this.dataBundle.estConvFromNav = data - this.dataBundle.changellyFeeTotalFromNav
          this.isDataSet = true

          this.validateDataBundle(this.dataBundle)
          .then(() => this.subject.next(this.dataBundle))
        })
    })

  }

  validateFormData(dataBundle):boolean {
    let isValid = true
    if(!Number.isInteger(dataBundle.transferAmount)){
      dataBundle.errors.invalidTransferAmount = true
      isValid = false
      dataBundle.validData = false
    }
    if(dataBundle.originCoin === 'nav' && dataBundle.destCoin === 'nav') {
      dataBundle.errors.navToNavTransfer = true
      isValid = false
      dataBundle.validData = false
    }
    if(dataBundle.transferAmount < this.getMinTransferAmount(dataBundle.originCoin, 'nav')) {
      dataBundle.errors.transferTooSmall = true
      isValid = false
      dataBundle.validData = false
    }
    return isValid
  }

  validateDataBundle(dataBundle) {
    return new Promise<any>( resolve => {
      if(dataBundle.estConvToNav > this.MAX_NAV_PER_TRADE) {
        dataBundle.errors.transferTooLarge = true
        dataBundle.validData = false
      }
      // if( !checkAddress(dataBundle.destAddr)) {
        // dataBundle.errors.invalidDestAddress  = true
      // }
      // if(changellyError () {
        // dataBundle.errors.changellyError = true
      // }
      resolve()
    })
  }

  getEstimatedExchange(originCoin, destCoin, transferAmount) {
    return new Promise<any>( resolve => {
      if(originCoin === 'nav' && destCoin === 'nav'){
        resolve(transferAmount)
      }
      this.changellyApi.getExchangeAmount(originCoin, destCoin, transferAmount)
      .subscribe( data => {
        resolve(data)
      }, (err) => {
        resolve (err)
      })
    })
  }

  getMinTransferAmount(originCoin, destCoin) {
    return new Promise<any>( resolve => {
      this.changellyApi.getMinAmount(originCoin, destCoin)
      .subscribe( data => {
        resolve(data)
      }, (err) => {
        resolve (err)
      })
    })
  }
}
