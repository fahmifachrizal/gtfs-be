import { prisma } from "../../utils/prisma.js"

// Get all stops for a project
export async function getStops(projectId, query = {}) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const search = query.search || ""
    const skip = (page - 1) * limit

    const whereClause = {
        project_id: projectId, // Enforce project scope
        ...(search && {
            OR: [
                { stop_name: { contains: search, mode: "insensitive" } },
                { stop_id: { contains: search, mode: "insensitive" } },
                { stop_desc: { contains: search, mode: "insensitive" } },
            ],
        })
    }

    const [stops, total] = await Promise.all([
        prisma.stop.findMany({
            where: whereClause,
            orderBy: { stop_id: "asc" },
            skip,
            take: limit,
        }),
        prisma.stop.count({ where: whereClause })
    ])

    return {
        stops,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    }
}
