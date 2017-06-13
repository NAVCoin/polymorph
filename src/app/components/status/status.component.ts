import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SendPageDataService } from '../../services/send-page-data/send-page-data';
import { ChangellyApiService } from '../../services/changelly-api/changelly-api';

@Component({
  selector: 'status-component',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit {

  transferAmount: number
  originCoin: string
  destCoin: string
  destAddr: string
  formDataSet: boolean = false

  estTime: object
  estConvToNav: any
  estConvFromNav: any

  changellyFeeTotalToNav: number
  changellyFeeTotalFromNav: number
  navtechFeeTotal: number
  validData:boolean
  formData: object = {}

  formDataSubscrip: Subscription


  constructor(private dataServ: SendPageDataService ) {
    this.getFormDataStream()
  }

  ngOnInit() {
  }

  getFormData() {
    this.dataServ.getData()
  }

  getFormDataStream() {
    this.dataServ.getDataStream().subscribe(data => {
      this.formData = data
      this.updateComponent(this.formData)
    })
  }

  updateComponent(formData):void {

    this.transferAmount = formData.transferAmount
    this.originCoin = formData.originCoin
    this.destCoin = formData.destCoin
    this.destAddr = formData.destAddr
    this.estConvToNav = formData.estConvToNav
    this.estConvFromNav = formData.estConvFromNav
    this.changellyFeeTotalToNav= formData.changellyFeeTotalToNav
    this.navtechFeeTotal= formData.navtechFeeTotal
    this.changellyFeeTotalFromNav= formData.changellyFeeTotalFromNav
    this.validData = formData.validData
    console.log(this.validData)
    console.log('data set')
    this.formDataSet = true
  }
}
