import { Sequelize, Op } from "sequelize";
import { Ticket } from "../models/ticket.model.js";
import { bodyReqFields } from "../utils/requiredFields.js"
import { convertToLowercase, validateEmail, validatePassword } from '../utils/utils.js';
import { Event, EventImages, FavouriteEvents, Pass, Room, Food } from "../models/event.model.js";
import { created, frontError, catchError, validationError, createdWithData, successOk, successOkWithData, notFound } from "../utils/responses.js";

// =============================================================
//                           Helping function
// =============================================================

function isDateSmallerThanToday(dateToCheck) {
    // Get today's date
    const today = new Date();

    // Set the time to 00:00:00 to only compare the dates
    today.setHours(0, 0, 0, 0);

    // Create a Date object from the dateToCheck (assuming dateToCheck is a string)
    const date = new Date(dateToCheck);

    // Compare the dates
    return date < today;
}

// ==============================================================

// Helper function to get the relative path from the static base path
function getRelativePath(fullPath) {
    const normalizedPath = fullPath.replace(/\\/g, '/');
    const index = normalizedPath.indexOf('/static');
    if (index === -1) return '';
    return normalizedPath.substring(index);
}


// ==============================================================
//                           Controllers
// ==============================================================

// ========================= getEvent ===========================

export async function getEvent(req, res) {
    try {
        const { uuid } = req.query
        if (!uuid) return frontError(res, 'this is required', 'uuid')

        const event = await Event.findOne({ where: { uuid } });
        if (!event) {
            return frontError(res, 'invalid uuid', 'uuid');
        }

        const ticketCount = await Ticket.count({
            where: {
                event_uuid: uuid
            }
        });

        const availableTickets = event.total_tickets - ticketCount
        event.dataValues.availableTickets = availableTickets

        return successOkWithData(res, "Event Fetched Successfully", event.dataValues)
    } catch (error) {
        console.log(error)
        catchError(res, error);
    }
}



// ========================= getFilteredEvents ===========================

export async function getFilteredEvents(req, res) {
    try {
        const { type, style, date, title, location, city, province } = req.query

        let filters = {}

        if (title) {
            filters.title = {
                [Op.like]: `%${title}%`
            };
        }

        if (location) {
            const locationCordinates = JSON.parse(location)
            const lat = locationCordinates[0]
            const lon = locationCordinates[1]

            // Filter events based on proximity to user-provided location within a 0.05 degree (5000 meters     ) radius
            filters.distance_in_degrees = Sequelize.literal(
                `ST_Distance(location, ST_SetSRID(ST_MakePoint(${lat}, ${lon}), 4326)) < 0.05`,
                true
            );
        }

        if (city) {
            filters.city = city
        }

        if (province) {
            filters.province = province
        }

        if (type) {
            const danceType = JSON.parse(type)
            filters.type = {
                [Op.in]: danceType
            }
        }

        if (style) {
            const danceStyle = JSON.parse(style)
            filters.style = {
                [Op.in]: danceStyle
            }
        }

        if (date) {
            if (isDateSmallerThanToday(date)) return successOkWithData(res, `Event on date ${date} has already occured.`, [])
            filters.date = date
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filters.date = { [Op.gte]: today }
        }


        const event = await Event.findAll({
            where: filters,
            attributes: {
                exclude: ['total_tickets', 'organizer', 'organizer_details', 'createdAt', 'updatedAt']
            },
            include: [{
                model: EventImages,
                as: 'event_images', // Assuming you have defined an association alias 'images'
                attributes: ['image_url'] // Optionally, specify which attributes to include from Image model
            }]
        });

        return successOkWithData(res, "Filtered Events Fetched Successfully", event);
    } catch (error) {
        console.log(error)
        catchError(res, error);
    }
}

// ======================= getEventBookingDetails ======================

export async function getEventBookingDetails(req, res) {
    try {

        const { eventUuid } = req.query
        if (!eventUuid) return validationError(res, "this is required", "eventUuid")

        const event = await Event.findOne({
            where: {
                uuid: eventUuid
            },
            attributes: ["type"]
        })
        if (!event) {
            return validationError(res, 'No Event Exist', 'eventUuid');
        }

        if (event.type === 'academy' || event.type === 'social') return validationError(res, "Booking is allowed for Concert and Congress Only")

        if (event.type === 'concert') {
            const passData = await Pass.findOne({
                where: {
                    event_uuid: eventUuid
                },
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'event_uuid']
                }
            })

            return successOkWithData(res, "Data Fetched", { passData })
        }
        // else
        const passesData = await Pass.findAll({
            where: {
                event_uuid: eventUuid
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'event_uuid']
            }

        })

        const roomsData = await Room.findAll({
            where: {
                event_uuid: eventUuid
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'event_uuid']
            }
        })

        const foodData = await Food.findOne({
            where: {
                event_uuid: eventUuid
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'event_uuid']
            }
        })

        return successOkWithData(res, "Data Fetched", { passesData, roomsData, foodData })
    } catch (error) {
        console.log(error)
        catchError(res, error);
    }
}

// =====================================================================
//                               Favourite Events
// =====================================================================

// =========================== getAllFavourites ========================

export async function getAllFavourites(req, res) {
    try {

        const userUid = req.user
        const { type, style, date, title, location, city, province } = req.query

        let filters = {}

        if (title) {
            filters.title = {
                [Op.like]: `%${title}%`
            };
        }

        if (location) {
            const locationCordinates = JSON.parse(location)
            const lat = locationCordinates[0]
            const lon = locationCordinates[1]

            // Filter events based on proximity to user-provided location within a 0.05 degree (5000 meters     ) radius
            filters.distance_in_degrees = Sequelize.literal(
                `ST_Distance(location, ST_SetSRID(ST_MakePoint(${lat}, ${lon}), 4326)) < 0.05`,
                true
            );
        }

        if (city) {
            filters.city = city
        }

        if (province) {
            filters.province = province
        }

        if (type) {
            const danceType = JSON.parse(type)
            filters.type = {
                [Op.in]: danceType
            }
        }

        if (style) {
            const danceStyle = JSON.parse(style)
            filters.style = {
                [Op.in]: danceStyle
            }
        }

        if (date) { filters.date = date }

        const favouriteEvents = await FavouriteEvents.findAll({
            where: {
                user_uuid: userUid
            },
            include: [
                {
                    model: Event,
                    as: 'event',
                    where: filters,
                    include: [
                        {
                            model: EventImages,
                            as: 'event_images',
                            attributes: ['image_url'],
                            limit: 1,
                            order: [['createdAt', 'ASC']],
                        }
                    ]
                }
            ]
        });

        return successOkWithData(res, "All Favourite Events Fetched Successfully", favouriteEvents)
    } catch (error) {
        console.log(error)
        catchError(res, error);
    }
}

// ========================= addToFavourites ===========================

export async function addToFavourites(req, res) {
    try {
        const userUid = req.user

        const { eventUuid } = req.query
        if (!eventUuid) {
            return frontError(res, 'this is required', "eventUuid")
        }

        const addedtoFavourites = await FavouriteEvents.create({ event_uuid: eventUuid, user_uuid: userUid })

        return successOkWithData(res, "Event Added to Favourites", addedtoFavourites)
    } catch (error) {
        console.log(error)
        catchError(res, error);
    }
}

// ========================= removeFromFavourites ======================

export async function removeFromFavourites(req, res) {
    try {
        const { uuid } = req.query
        if (!uuid) {
            return frontError(res, 'this is required', "uuid")
        }

        const favouriteEvent = await FavouriteEvents.findOne({ where: { uuid } });
        if (!favouriteEvent) {
            return frontError(res, 'invalid uuid', 'uuid');
        }

        await favouriteEvent.destroy();

        return successOk(res, "Event Removed from Favourites")
    } catch (error) {
        console.log(error)
        catchError(res, error);
    }
}


// Dashboard apis
// ========================= addEvent ===========================



// ========================= updateEvent ===========================



// ========================= deleteEvent ===========================



// =====================================================================
//                                  Passes 
// =====================================================================

// ============================= addConcertPass ========================


// ========================= addCongressPass ========================


// =====================================================================
//                                  Rooms
// =====================================================================

// ========================= addCongressRooms ===========================



// =====================================================================
// ================================= Food ==============================
// =====================================================================

// ========================= addCongressFood ===========================



// patch and delete apis will be created with dashboard
