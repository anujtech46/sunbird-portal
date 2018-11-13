import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ResourceService } from '@sunbird/shared';
@Component({
  selector: 'app-addusersorgs',
  templateUrl: './addusersorgs.component.html',
  styleUrls: ['./addusersorgs.component.css']
})
export class AddusersorgsComponent implements OnInit {
  public resourceService: ResourceService;

  constructor(resourceService: ResourceService) {
    this.resourceService = resourceService;
  }

  ngOnInit() {
  }

}
