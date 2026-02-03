import { prisma } from "../../utils/prisma.js"

// Helper function to format day availability
function formatDayAvailability(calendar) {
    const days = {
        monday: calendar.monday === 1,
        tuesday: calendar.tuesday === 1,
        wednesday: calendar.wednesday === 1,
        thursday: calendar.thursday === 1,
        friday: calendar.friday === 1,
        saturday: calendar.saturday === 1,
        sunday: calendar.sunday === 1,
    }

    const weekdayCount = [days.monday, days.tuesday, days.wednesday, days.thursday, days.friday].filter(Boolean).length
    const weekendCount = [days.saturday, days.sunday].filter(Boolean).length
    const totalActiveDays = weekdayCount + weekendCount

    // Check for common patterns
    if (totalActiveDays === 7) {
        return "everyday"
    } else if (weekdayCount === 5 && weekendCount === 0) {
        return "weekday"
    } else if (weekdayCount === 0 && weekendCount === 2) {
        return "weekend"
    } else if (weekdayCount === 5 && weekendCount === 2) {
        return "everyday"
    } else {
        // List specific days
        const activeDays = []
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        const dayValues = [days.monday, days.tuesday, days.wednesday, days.thursday, days.friday, days.saturday, days.sunday]

        dayValues.forEach((active, index) => {
            if (active) activeDays.push(dayNames[index])
        })

        return activeDays.join(", ")
    }
}

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

    // Format calendars with day availability
    const formattedCalendars = calendars.map(calendar => ({
        ...calendar,
        service_name: formatDayAvailability(calendar)
    }))

    return {
        calendar: formattedCalendars,
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
