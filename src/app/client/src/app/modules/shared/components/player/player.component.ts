import { WindowScrollService, ConfigService } from './../../services';

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, OnDestroy, Output, EventEmitter, OnChanges } from '@angular/core';
import * as _ from 'lodash';
import * as $ from 'jquery';
import {PlayerConfig} from './../../interfaces';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() playerConfig: PlayerConfig;
  @Input() externalContentData: any;
  @Output() contentProgressEvent = new EventEmitter<any>();
  @Output() public startNoteBookPing: EventEmitter<any> = new EventEmitter();
  @ViewChild('contentIframe') contentIframe: ElementRef;
  constructor(public configService: ConfigService) {
    (<any>window).open_notebook = this.open_notebook.bind(this);
  }
  /**
   * showPlayer method will be called
   */
  ngOnInit() {
    this.showPlayer();
  }

  ngOnChanges() {
    this.showPlayer();
  }
  /**
   * Initializes player with given config and emits player telemetry events
   * Emits event when content starts playing and end event when content was played/read completely
   */
  showPlayer () {
    const iFrameSrc = this.configService.appConfig.PLAYER_CONFIG.baseURL;
    setTimeout(() => {
      this.contentIframe.nativeElement.src = iFrameSrc;
      this.contentIframe.nativeElement.onload = () => {
        this.adjustPlayerHeight();
        this.contentIframe.nativeElement.contentWindow.initializePreview(this.playerConfig);
      };
    }, 0);
    this.contentIframe.nativeElement.addEventListener('renderer:telemetry:event', (event: any) => {
      if (event.detail.telemetryData.eid && (event.detail.telemetryData.eid === 'START' || event.detail.telemetryData.eid === 'END')) {
        this.contentProgressEvent.emit(event);
      }
    });
  }
  /**
   * Adjust player height after load
   */
  adjustPlayerHeight () {
    const playerWidth = $('#contentPlayer').width();
    if (playerWidth) {
      const height = playerWidth * (9 / 16);
      $('#contentPlayer').css('height', height + 'px');
    }
  }

  loadCourseDetails () {
    const uid = this.externalContentData.userId;
    const contentId = this.externalContentData.contentId;
    const courseId = this.externalContentData.courseId;
    const batchId = this.externalContentData.batchId;
    const courseDetailsStr = '?courseId=' + courseId + '&contentId=' + contentId +
                             '&batchId=' + batchId + '&uid=' + uid;
    return courseDetailsStr;
  }

  open_notebook = (url) => {
    const newUrl = url + this.loadCourseDetails();
    console.log('Open notebook link:', newUrl);
    this.startNoteBookPing.emit();
    window.open(newUrl);
  }

  ngOnDestroy() {
    window.open_noteBook = null;
  }
}
