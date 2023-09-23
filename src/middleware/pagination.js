const pagination = async (req, res, next) => {
  const pageNumber = Number.parseInt(req.query.page)
  const pageSize = Number.parseInt(req.query.size)

  let page = Number.isNaN(pageNumber) ? 0 : pageNumber
  if (page < 0) {
    page = 0
  }

  let size = Number.isNaN(pageSize) ? 10 : pageSize
  if (size < 1 || size > 10) {
    size = 10
  }

  req.pagination = { page, size }

  return next()
}

module.exports = pagination
