import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-terms-of-user',
  templateUrl: './terms-of-user.component.html',
  styleUrls: ['./terms-of-user.component.css']
})
export class TermsOfUserComponent implements OnInit {

  pdfSrc: string;
  constructor() { }

  ngOnInit() {
    this.pdfSrc = (<HTMLInputElement>document.getElementById('termsOfService')).value;
  }

}
