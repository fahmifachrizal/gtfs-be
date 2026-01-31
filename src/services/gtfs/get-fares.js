import { prisma } from "../../utils/prisma.js"

// Get fare attributes for a project with pagination and search
export async function getFares(projectId, query = {}) {
    const { page = 1, limit = 10, search = "" } = query
    const skip = (page - 1) * limit

    const whereClause = {
        project_id: projectId,
        ...(search && {
            OR: [
                { fare_id: { contains: search, mode: "insensitive" } },
            ],
        }),
    }

    const [fares, total] = await Promise.all([
        prisma.fareAttribute.findMany({
            where: whereClause,
            include: {
                agency: {
                    select: {
                        agency_id: true,
                        agency_name: true,
                    }
                },
                fareRules: true
            },
            orderBy: { fare_id: "asc" },
            skip,
            take: Number(limit),
        }),
        prisma.fareAttribute.count({ where: whereClause })
    ])

    return {
        fares,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    }
}

// Get a single fare by fare_id
export async function getFareById(projectId, fareId) {
    const fare = await prisma.fareAttribute.findFirst({
        where: {
            fare_id: fareId,
            project_id: projectId
        },
        include: {
            agency: true,
            fareRules: {
                include: {
                    route: {
                        select: {
                            route_id: true,
                            route_short_name: true,
                        }
                    }
                }
            }
        }
    })

    if (!fare) throw new Error("Fare not found")
    return fare
}

// Get fare rules for a project
export async function getFareRules(projectId, query = {}) {
    const { page = 1, limit = 10, fare_id = null } = query
    const skip = (page - 1) * limit

    const whereClause = {
        project_id: projectId,
        ...(fare_id && { fare_id }),
    }

    const [fareRules, total] = await Promise.all([
        prisma.fareRule.findMany({
            where: whereClause,
            include: {
                fare_attribute: true,
                route: {
                    select: {
                        route_id: true,
                        route_short_name: true,
                    }
                }
            },
            orderBy: { fare_id: "asc" },
            skip,
            take: Number(limit),
        }),
        prisma.fareRule.count({ where: whereClause })
    ])

    return {
        fareRules,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    }
}
