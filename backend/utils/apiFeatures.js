export class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose query object
    this.queryString = queryString; // req.query object (e.g. page, limit, sort, q)
  }

  filter() {
    // 1. Basic Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "q"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 2. Advanced Filtering (handles gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search(searchFields = []) {
    if (this.queryString.q && searchFields.length > 0) {
      const searchVal = this.queryString.q.trim();
      const orConditions = searchFields.map((field) => ({
        [field]: { $regex: searchVal, $options: "i" },
      }));
      this.query = this.query.find({ $or: orConditions });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); // Default newest first
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      let fields = this.queryString.fields;
      if (fields === "minimal") {
        fields = "title category doctorName createdAt summary";
      } else {
        fields = fields.split(",").join(" ");
      }
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v"); // Default exclude version field
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
export default APIFeatures;
