import { Component, AfterViewInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import 'jquery.fancytree';
import { IFancytreeOptions } from '../../interfaces';
import * as _ from 'lodash';

@Component({
  selector: 'app-fancy-tree',
  templateUrl: './fancy-tree.component.html',
  styles: [`
  ::ng-deep .fancytree-plain span.fancytree-node span.fancytree-title {
      margin-left: 5px;
      vertical-align: middle;
      padding-top: 4px;
      padding-bottom: 4px;
  }
  ::ng-deep span.fancytree-active span.fancytree-title {
      background-color: #007Aff;
      color: #fff;
  }
  ::ng-deep span.fancytree-icon {
    vertical-align: middle;
  }
  ::ng-deep span.fancytree-expander {
    vertical-align: middle;
  }
  `]
})
export class FancyTreeComponent implements AfterViewInit {
  @ViewChild('fancyTree') public tree: ElementRef;
  @Input() public nodes: any;
  @Input() public options: IFancytreeOptions;
  @Input() public contentState: any;
  @Output() public itemSelect: EventEmitter<Fancytree.FancytreeNode> = new EventEmitter();

  ngAfterViewInit() {
    let options: IFancytreeOptions = {
      extensions: ['glyph'],
      clickFolderMode: 3,
      source: this.nodes,
      glyph: {
        preset: 'awesome4',
        map: {
          folder: 'fa fa-folder-o fa-lg',
          folderOpen: 'fa fa-folder-open-o fa-lg'
        }
      },
      click: (event, data): boolean => {
        if (data.targetType === 'title') {
          const node = data.node;
          this.itemSelect.emit(node);
        }
        return true;
      },
      renderNode: (event, data) => {
        this.updateNodeTitle(data);
      },
    };
    options = { ...options, ...this.options };
    $(this.tree.nativeElement).fancytree(options);
    if (this.options.showConnectors) {
      $('.fancytree-container').addClass('fancytree-connectors');
    }
  }

  /**
   * This function is used to update the node title with score and feedback
   */
  updateNodeTitle = (data) => {
    let title = '';
    const scoreData: any = _.find(this.contentState, { 'contentId': data.node.data.id });
    if (scoreData) {
      if (scoreData.grade) {
        title = title + '<span class="fancy-tree-feedback">( Score: ' +
          scoreData.grade + '/' + scoreData.score + ' ) </span>';
      }
      if (scoreData.result) {
        const feedbackLinkHtml = '<span> <a href=' + scoreData.result +
        ' target="_blank" return false; onclick="event.stopPropagation();"> Feedback </a> </span>';
        title = title + feedbackLinkHtml;
      }
    }
    const $nodeSpan = $(data.node.span);
    if (!$nodeSpan.data('rendered')) {
      $nodeSpan.append($(title));
      $nodeSpan.data('rendered', true);
    }
  }
}
