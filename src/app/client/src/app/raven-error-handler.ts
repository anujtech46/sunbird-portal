import * as Raven from 'raven-js';
import { ErrorHandler } from '@angular/core';

export class RavenErrorHandler implements ErrorHandler {
  handleError(err: any): void {
    const stringError = err.message;
    const ignoreValueProvidedError = stringError.includes('value provided');
    const ignoreStreamError = stringError.includes('where a stream was expected');
    if (!(ignoreValueProvidedError || ignoreStreamError)) {
      Raven.captureException(err, { captureUnhandledRejections: false, allowDuplicates: false, level: 'critical' });
    }
  }
}
