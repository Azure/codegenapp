import { inject } from "inversify";
import { BaseHttpController } from "inversify-express-utils";
import { InjectableTypes } from "../lib/injectableTypes";
import { Logger } from "../lib/Logger";

export abstract class BaseController extends BaseHttpController {
    constructor(@inject(InjectableTypes.Logger) protected logger: Logger) {
        super();
    }
}