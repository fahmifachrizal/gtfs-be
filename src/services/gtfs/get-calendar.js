import { prisma } from "../../utils/prisma.js"

// Get calendar entries for a project with pagination and search
export async function getCalendar(projectId, query = {}) {
    const { page = 1, limit = 10, search = "" } = query
    const skip = (page - 1) * limit

    const whereClause = {
        project_id: projectId,
        ...(search && {
            OR: [
                { service_id: { contains: search, mode: "insensitive" } },
            ],
        }),
    }

    const [calendars, total] = await Promise.all([
        prisma.calendar.findMany({
            where: whereClause,
            orderBy: { service_id: "asc" },
            skip,
            take: Number(limit),
        }),
        prisma.calendar.count({ where: whereClause })
    ])

    return {
        calendar: calendars,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    }
}

// Get a single calendar entry by service_id
export async function getCalendarById(projectId, serviceId) {
    const calendar = await prisma.calendar.findFirst({
        where: {
            service_id: serviceId,
            project_id: projectId
        },
        include: {
            trips: {
                select: {
                    trip_id: true,
                    trip_headsign: true,
                    route_id: true,
                }
            },
            exceptions: true
        }
    })

    if (!calendar) throw new Error("Calendar not found")
    return calendar
}
