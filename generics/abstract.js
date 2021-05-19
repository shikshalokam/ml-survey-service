let Abstract = class Abstract {
  constructor(schema) {
    this.model = database.createModel(schema);
    this.schema = schema.name;

    this.httpStatus = {
      ok: 200,
      notFound: 404,
      badRequest: 400
    };
  }

  //insert
  insert(req) {
    let query = req.body ? req.body : req;
    let self = this;
    return new Promise((resolve, reject) => {
      return this.model
        .create(query)
        .then(result => {
          resolve({
            result: result,
            status: self.httpStatus.ok,
            message: self.schema + " record created successfully"
          });
        })
        .catch(error => {
          reject({
            error: error,
            status: self.httpStatus.badRequest,
            message: error.message
          });
        });
    });
  }

  //findAndUpdate
  update(req) {
    let self = this;
    let options = { multi: true, runValidators: true };
    return new Promise((resolve, reject) => {
      self.model.update(req.query, req.body, options, (error, data) => {
        if (error) {
          reject({
            error: error,
            status: self.httpStatus.badRequest,
            message: error.message
          });
        } else if (!data || !data.nModified) {
          reject({
            error: error,
            status: self.httpStatus.notFound,
            message: "No " + self.schema + " record found"
          });
        } else {
          resolve({
            status: self.httpStatus.ok,
            message: self.schema + " record updated successfully"
          });
        }
      });
    });
  }

  findByIdAndUpdate(req) {
    let query = req.body ? req.body : req,
      self = this;
    if (!query._id) throw new Error("_id is missing");
    let options = { runValidators: true, new: true };
    return new Promise((resolve, reject) => {
      self.model.findByIdAndUpdate(query._id, query, options, (error, data) => {
        if (error) {
          reject({
            error: error,
            status: self.httpStatus.badRequest,
            message: error.message
          });
        } else if (!data) {
          reject({
            error: error,
            status: self.httpStatus.notFound,
            message: "No " + self.schema + " record found"
          });
        } else {
          resolve({
            result: data,
            status: self.httpStatus.ok,
            message: self.schema + " record updated successfully"
          });
        }
      });
    });
  }

  //delete
  remove(req) {
    let self = this;
    let query = req.query ? req.query : req;
    return new Promise((resolve, reject) => {
      self.model.delete(query, (error, data) => {
        if (error) {
          reject({
            error: error,
            status: self.httpStatus.badRequest,
            message: error.message
          });
        } else if (!data || (data && data.nModified == 0)) {
          reject({
            error: true,
            status: self.httpStatus.notFound,
            message: "No " + self.schema + " record found"
          });
        } else {
          resolve({
            status: self.httpStatus.ok,
            message: self.schema + " record deleted successfully"
          });
        }
      });
    });
  }

  populate(req) {
    let self = this,
      query = req.query ? req.query : req,
      findQuery = self._constructFindQuery(query);
    return new Promise((resolve, reject) => {
      findQuery.populate(req.populate).exec((error, data) => {
        if (error) {
          reject({
            error: error,
            status: self.httpStatus.badRequest,
            message: error.message
          });
        } else if (!data || data.length == 0) {
          reject({
            error: true,
            status: self.httpStatus.notFound,
            message: "No " + self.schema + " record found"
          });
        } else {
          resolve({
            result: data,
            status: self.httpStatus.ok,
            message: self.schema + " record found successfully"
          });
        }
      });
    });
  }

  find(req) {
    let self = this,
      query = req.query ? req.query : req,
      findQuery = self._constructFindQuery(query);
    return new Promise((resolve, reject) => {
      findQuery.exec((error, data) => {
        if (error) {
          reject({
            error: error,
            status: self.httpStatus.badRequest,
            message: error.message
          });
        } else if (!data || data.length == 0) {
          reject({
            error: true,
            status: self.httpStatus.notFound,
            message: "No " + self.schema + " record found"
          });
        } else {
          resolve({
            result: data,
            status: self.httpStatus.ok,
            message: self.schema + " record found successfully"
          });
        }
      });
    });
  }
  
  _getSelectedFields(fields) {
    // Removed below line from layer
    //let f = fields !== undefined ? fields.replace(/,/g, " ") : "";
    return fields;
  }

  _constructFindQuery(query) {
    let paginate = {};
    //pagination
    if (query.limit) {
      paginate.limit = parseInt(limit);
      delete query.limit;
    }
    if (query.skip) {
      paginate.skip = parseInt(skip);
      delete query.skip;
    }
    if (query.sortField && query.sortOrder) {
      paginate.sort = {};
      paginate.sort[query.sortField] = query.sortOrder;
      delete query.sortField;
      delete query.sortOrder;
    } else paginate.sort = { createdAt: -1 };

    //for search
    if (query.searchText && query.searchFields) {
      let search = [];
      let searchText = query["searchText"].split(",");
      query["searchFields"].split(",").forEach(function(field) {
        var dict = {};
        searchText.forEach(function(text) {
          dict[field] = new RegExp(text, "i");
          search.push(dict);
        });
        delete query.searchFields;
        delete query.searchText;
      });
      query.$or = search;
    }

    let fields = "";
    if (query.fields) {
      fields = this._getSelectedFields(query.fields);
      delete query.fields;
    }

    //for populate
    if (query.populate) {
      let populate = query.populate,
        subFields = "";
      delete query.populate;
      if (query.subFields) {
        subFields = this._getSelectedFields(query.subFields);
        delete query.subFields;
      }
      return this.model
        .find(query, fields, paginate)
        .populate(populate, subFields);
    } else {
      return this.model.find(query, fields, paginate);
    }
  }
};

module.exports = Abstract;
