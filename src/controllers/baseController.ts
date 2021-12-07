import { injectableTypes } from '../injectableTypes/injectableTypes';
import { Logger } from '../utils/logger/logger';
import { inject } from 'inversify';
import { BaseHttpController } from 'inversify-express-utils';

export abstract class BaseController extends BaseHttpController {
    @inject(injectableTypes.Logger) protected logger: Logger;
}
