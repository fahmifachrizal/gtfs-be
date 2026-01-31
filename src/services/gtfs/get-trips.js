import { prisma } from "../../utils/prisma.js"

// Get all trips for a project with pagination and search
export async function getTrips(projectId, query = {}) {
    const { page = 1, limit = 10, search = "", route_id = null } = query
    const skip = (page - 1) * limit

    const whereClause = {
        project_id: projectId,
        ...(search && {
            OR: [
                { trip_id: { contains: search, mode: "insensitive" } },
                { trip_headsign: { contains: search, mode: "insensitive" } },
                { trip_short_name: { contains: search, mode: "insensitive" } },
            ],
        }),
        ...(route_id && { route_id }),
    }

    const [trips, total] = await Promise.all([
        prisma.trip.findMany({
            where: whereClause,
            include: {
                route: {
                    select: {
                        route_id: true,
                        route_short_name: true,
                        route_long_name: true,
                        route_color: true,
                    }
                },
                calendar: {
                    select: {
                        service_id: true,
                        start_date: true,
                        end_date: true,
                    }
                }
            },
            orderBy: [{ route_id: "asc" }, { trip_id: "asc" }],
            skip,
            take: Number(limit),
        }),
        prisma.trip.count({ where: whereClause })
    ])

    return {
        trips,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    }
}

// Get a single trip by ID
export async function getTripById(projectId, tripId) {
    const trip = await prisma.trip.findFirst({
        where: {
            trip_id: tripId,
            project_id: projectId
        },
        include: {
            route: true,
            calendar: true,
            stopTimes: {
                orderBy: { stop_sequence: "asc" },
                include: {
                    stop: true
                }
            }
        }
    })

    if (!trip) throw new Error("Trip not found")
    return trip
}
