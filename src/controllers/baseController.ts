import { inject } from 'inversify';
import { BaseHttpController } from 'inversify-express-utils';

import { InjectableTypes } from '../injectableTypes/injectableTypes';
import { Logger } from '../utils/logger/logger';

export abstract class BaseController extends BaseHttpController {
    @inject(InjectableTypes.Logger) protected logger: Logger;
}
