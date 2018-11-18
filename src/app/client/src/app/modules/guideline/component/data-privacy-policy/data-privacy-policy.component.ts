import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-data-privacy-policy',
  templateUrl: './data-privacy-policy.component.html',
  styleUrls: ['./data-privacy-policy.component.css']
})
export class DataPrivacyPolicyComponent implements OnInit {

  pdfSrc: string;
  constructor() { }

  ngOnInit() {
    this.pdfSrc = (<HTMLInputElement>document.getElementById('privacyPolicy')).value;
  }

}
