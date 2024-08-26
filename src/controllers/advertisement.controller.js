import { Op } from 'sequelize';
import { bodyReqFields } from "../utils/requiredFields.js"
import { Advertisement } from "../models/advertisement.model.js";
import { frontError, catchError, successOk, validationError, successOkWithData } from "../utils/responses.js";
import { convertToLowercase, validateEmail, validatePhone } from '../utils/utils.js';

// =============================================================
//                           Helping function
// =============================================================

// Helper function to validate YouTube URLs
const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|user\/|playlist\/|watch\?v=|embed\/|v\/)?|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    return youtubeRegex.test(url);
};

// Helper function to validate Instagram URLs
const validateInstagramUrl = (url) => {
    const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/;
    return instagramRegex.test(url);
};

// Helper function to validate Spotify URLs
const validateSpotifyUrl = (url) => {
    const spotifyRegex = /^(https?:\/\/)?(www\.)?spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]{22}$/;
    return spotifyRegex.test(url);
};

// ==============================================================

// Helper function to get the relative path from the static base path
function getRelativePath(fullPath) {
    const normalizedPath = fullPath.replace(/\\/g, '/');
    const index = normalizedPath.indexOf('/static');
    if (index === -1) return '';
    return normalizedPath.substring(index);
}

// ========================= getAdvertisement ===========================

export async function getAdvertisement(req, res) {
    try {
        const reqData = convertToLowercase(req.query)

        const { title, category } = reqData

        let filters = {}

        if (title) {
            filters.title = {
                [Op.like]: `%${title}%`
            };
        }
        if (category) {
            filters.category = category
        }

        const advertisement = await Advertisement.findAll({
            where: filters,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        });

        return successOkWithData(res, "Advertisements Fetched Successfully", advertisement)
    } catch (error) {
        console.log(error)
        catchError(res, error);
    }
}


// Dashboard apis
// ========================= createAdvertisement ===========================


// ========================= updateAdvertisement ===========================



// ========================= deleteAdvertisement ===========================

