/* eslint-disable camelcase */
const paginate = (list, page) => {
  const queryPage = parseInt(page, 10);
  const startAt = 0 + ((queryPage - 1) * 12);
  const endAt = 11 + ((queryPage - 1) * 12);
  const total_pages = list.length < 12 ? 1 : Math.ceil(list.length / 12);

  if (queryPage < 1 || queryPage > total_pages) throw new Error();

  return {
    pageContent: list.slice(startAt, endAt + 1),
    pagination: {
      total_pages,
      current_page: queryPage,
      has_pre: queryPage !== 1,
      has_next: queryPage !== total_pages,
      category: null,
    },
  };
};

module.exports = paginate;
