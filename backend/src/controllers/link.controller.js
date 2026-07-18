import {
  createLinkService,
  getAllLinksService,
  getLinkByTokenService,
  updateLinkService,
  deleteLinkService,
} from "../services/link.service.js";

export const createLink = async (req, res) => {
  try {
    const { title, expiresAt } = req.body;

    const link = await createLinkService(
      req.user.id,
      title,
      expiresAt
    );

    res.status(201).json({
      success: true,
      message: "Capture link created successfully",
      data: link,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllLinks = async (req, res) => {
  try {
    const links = await getAllLinksService(req.user.id);

    res.json({
      success: true,
      data: links,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLinkByToken = async (req, res) => {
  try {
    const link = await getLinkByTokenService(req.params.token);

    res.json({
      success: true,
      data: link,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateLink = async (req, res) => {
  try {
    const { title, expiresAt, isActive } = req.body;

    const link = await updateLinkService(
      req.params.id,
      title,
      expiresAt,
      isActive
    );

    res.json({
      success: true,
      message: "Link updated successfully",
      data: link,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteLink = async (req, res) => {
  try {
    await deleteLinkService(req.params.id);

    res.json({
      success: true,
      message: "Link deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};