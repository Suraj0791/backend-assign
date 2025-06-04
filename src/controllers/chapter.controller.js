const Chapter = require("../models/chapter.model");
const { clearCache } = require("../middleware/cache.middleware");

// GET /api/v1/chapters
exports.getChapters = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      class: className,
      unit,
      status,
      weakChapters,
      subject,
    } = req.query;
    const filter = {};
    if (className) filter.class = className;
    if (unit) filter.unit = unit;
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (weakChapters !== undefined)
      filter.isWeakChapter = weakChapters === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Chapter.countDocuments(filter);
    const chapters = await Chapter.find(filter)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      chapters,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/chapters/:id
exports.getChapterById = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res
        .status(404)
        .json({ status: "error", message: "Chapter not found" });
    }
    res.json(chapter);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/chapters (create a single chapter)
exports.createChapter = async (req, res, next) => {
  try {
    const chapterData = req.body;
    const chapter = new Chapter(chapterData);
    await chapter.save();

    // Invalidate cache for the main chapters list and any specific queries
    await clearCache('/api/v1/chapters*'); 

    res.status(201).json({
      status: "success",
      message: "Chapter created successfully",
      data: chapter,
    });
  } catch (error) {
    // Handle validation errors or other save errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ status: "error", message: error.message });
    }
    next(error);
  }
};

// POST /api/v1/chapters/upload
exports.uploadChapters = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded" });
    }
    let chaptersData;
    try {
      chaptersData = JSON.parse(req.file.buffer.toString());
    } catch (e) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid JSON file" });
    }
    if (!Array.isArray(chaptersData)) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Uploaded file must be an array of chapters",
        });
    }
    const failed = [];
    const inserted = [];
    for (const data of chaptersData) {
      try {
        const chapter = new Chapter(data);
        await chapter.save();
        inserted.push(chapter);
      } catch (err) {
        failed.push({ data, error: err.message });
      }
    }
    // Invalidate cache for chapters endpoint
    await clearCache("*");
    res.json({
      inserted: inserted.length,
      failed,
      message: failed.length
        ? "Some chapters failed to upload"
        : "All chapters uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
};
