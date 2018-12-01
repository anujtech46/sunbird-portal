import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { ICard } from '@sunbird/shared';
import * as moment from 'moment';
@Injectable()
export class UtilService {
  getDataForCard(data, staticData, dynamicFields, metaData) {
    const list: Array<ICard> = [];
    _.forEach(data, (item, key) => {
      const card = this.processContent(item, staticData, dynamicFields, metaData);
      list.push(card);
    });
    return <ICard[]>list;
  }

  processContent(data, staticData, dynamicFields, metaData) {
    let fieldValue: any;
    const content = {
      name: data.name || data.courseName,
      image: data.appIcon || data.courseLogoUrl,
      description: data.description,
      rating: data.me_averageRating || '0'
    };
      _.forIn(staticData, (value, key1) => {
        content[key1] = value;
      });
      _.forIn(metaData, (value, key1) => {
        content[key1] = _.pick(data, value);
      });
      _.forIn(dynamicFields, (fieldData, fieldName) => {
          fieldValue =  _.get(data, fieldData);
          const name = _.zipObjectDeep([fieldName], [fieldValue]);
          _.forIn(name, (values, index) => {
            content[index] = _.merge(name[index], content[index]);
          });
      });
     return content;
  }

  parseDurationInMS(durationInMS) {
    let totalDuration = '';
    const hour = moment.utc(durationInMS).hours();
    const min = moment.utc(durationInMS).minutes() + hour * 60;
    const second = moment.utc(durationInMS).seconds() || '00';
    // totalDuration += hour ? hour + 'h : ' : '  ';
    totalDuration += min ? min + 'm' : '  ';
    totalDuration += second ? ' : ' + second + 's' : '';
    return totalDuration;
  }

  parseDurationInHM(durationInMS) {
    let totalDuration = '';
    const hour = moment.utc(durationInMS).hours();
    const min = moment.utc(durationInMS).minutes();
    const second = moment.utc(durationInMS).seconds() || '00';
    totalDuration += hour ? hour + 'h : ' : '';
    totalDuration += min ? min + 'm' : '';
    if (!hour) {
      totalDuration += second ? ' : ' + second + 's' : '';
    }
    return totalDuration;
  }
}
