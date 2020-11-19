const express = require("express");
const { v4: uuid } = require("uuid");
const logger = require("../logger");
const { bookmarks } = require("../store");
const BookmarksService = require("./bookmarks-service");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = (bookmark) => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: Number(bookmark.rating),
});

bookmarksRouter
  .route("/bookmarks")
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get("db"))
      .then((bookmarks) => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res) => {
    const { url, title, rating, description } = req.body;

    if (!url) {
      logger.error(`Url is required`);
      return res.status(400).send("Url is required");
    }
    if (!title) {
      logger.error(`Title is required`);
      return res.status(400).send("Title is required");
    }
    if (!rating || !Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Rating is required`);
      return res.status(400).send("Rating must be a number between 0 and 5");
    }
    if (!description) {
      logger.error(`Description is required`);
      return res.status(400).send("Description is required");
    }

    const id = uuid();
    const bookmark = {
      url,
      title,
      rating,
      description,
      id,
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);
  });

bookmarksRouter
  .route("/bookmarks/:id")
  .get((req, res, next) => {
    const { id } = req.params;
    console.log(req.params);

    BookmarksService.getById(req.app.get("db"), id)
      .then((bookmark) => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark Not Found` },
          });
        }
        res.json(serializeBookmark(bookmark));
      })
      .catch(next);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex((b) => b.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send("Not found");
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarksRouter;
