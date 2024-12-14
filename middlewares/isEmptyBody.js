import HttpError from '../helpers/HttpError.js';

const isEmptyBody = (req, res, next) => {
  try {
    if (!Object.keys(req.body).length) {
      throw new HttpError(400, 'Body cannot be empty');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default isEmptyBody;
