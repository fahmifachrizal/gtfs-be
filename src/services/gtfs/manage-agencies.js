import { prisma } from "../../utils/prisma.js"

/**
 * Create a new agency
 */
export async function createAgency(projectId, data, userId = null) {
    const {
        agency_id,
        agency_name,
        agency_url,
        agency_timezone,
        agency_lang,
        agency_phone,
        agency_fare_url,
        agency_email
    } = data

    if (!agency_name) {
        throw new Error("agency_name is required")
    }

    if (!agency_url) {
        throw new Error("agency_url is required")
    }

    if (!agency_timezone) {
        throw new Error("agency_timezone is required")
    }

    // Validate URL format
    try {
        new URL(agency_url)
    } catch (e) {
        throw new Error("agency_url must be a valid URL")
    }

    if (agency_fare_url) {
        try {
            new URL(agency_fare_url)
        } catch (e) {
            throw new Error("agency_fare_url must be a valid URL")
        }
    }

    // Validate timezone format (basic check)
    // Common timezones: "America/New_York", "Europe/London", "Asia/Jakarta"
    if (!agency_timezone.includes('/')) {
        throw new Error("agency_timezone must be a valid IANA timezone (e.g., 'Asia/Jakarta')")
    }

    // Generate agency_id if not provided
    const finalAgencyId = agency_id || `agency-${Date.now()}`

    // Check if agency_id already exists in this project
    const existing = await prisma.agency.findFirst({
        where: {
            agency_id: finalAgencyId,
            project_id: projectId
        }
    })

    if (existing) {
        throw new Error("Agency with this ID already exists in this project")
    }

    return await prisma.agency.create({
        data: {
            agency_id: finalAgencyId,
            agency_name,
            agency_url,
            agency_timezone,
            agency_lang: agency_lang || 'en',
            agency_phone,
            agency_fare_url,
            agency_email,
            project_id: projectId,
            created_by: userId
        }
    })
}

/**
 * Get all agencies for a project
 */
export async function getAgencies(projectId, { page = 1, limit = 10, search = '' } = {}) {
    const offset = (page - 1) * limit

    const where = {
        project_id: projectId,
        ...(search && {
            OR: [
                {
                    agency_name: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    agency_id: {
                        contains: search,
                        mode: 'insensitive'
                    }
                }
            ]
        })
    }

    const [data, total] = await Promise.all([
        prisma.agency.findMany({
            where,
            orderBy: {
                agency_name: 'asc'
            },
            skip: offset,
            take: limit
        }),
        prisma.agency.count({ where })
    ])

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}

/**
 * Get a single agency by ID
 */
export async function getAgency(projectId, agencyId) {
    const agency = await prisma.agency.findFirst({
        where: {
            agency_id: agencyId,
            project_id: projectId
        },
        include: {
            routes: {
                select: {
                    route_id: true,
                    route_short_name: true,
                    route_long_name: true
                }
            },
            fareAttributes: {
                select: {
                    fare_id: true,
                    price: true,
                    currency_type: true
                }
            }
        }
    })

    if (!agency) {
        throw new Error("Agency not found in this project")
    }

    return agency
}

/**
 * Update an agency
 */
export async function updateAgency(projectId, agencyId, data, userId = null) {
    const existing = await prisma.agency.findFirst({
        where: {
            agency_id: agencyId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Agency not found in this project")
    }

    const updateData = {}

    if (data.agency_name !== undefined) {
        if (!data.agency_name) {
            throw new Error("agency_name cannot be empty")
        }
        updateData.agency_name = data.agency_name
    }

    if (data.agency_url !== undefined) {
        if (!data.agency_url) {
            throw new Error("agency_url cannot be empty")
        }
        try {
            new URL(data.agency_url)
        } catch (e) {
            throw new Error("agency_url must be a valid URL")
        }
        updateData.agency_url = data.agency_url
    }

    if (data.agency_timezone !== undefined) {
        if (!data.agency_timezone) {
            throw new Error("agency_timezone cannot be empty")
        }
        if (!data.agency_timezone.includes('/')) {
            throw new Error("agency_timezone must be a valid IANA timezone")
        }
        updateData.agency_timezone = data.agency_timezone
    }

    if (data.agency_lang !== undefined) updateData.agency_lang = data.agency_lang
    if (data.agency_phone !== undefined) updateData.agency_phone = data.agency_phone
    if (data.agency_email !== undefined) updateData.agency_email = data.agency_email

    if (data.agency_fare_url !== undefined) {
        if (data.agency_fare_url) {
            try {
                new URL(data.agency_fare_url)
            } catch (e) {
                throw new Error("agency_fare_url must be a valid URL")
            }
        }
        updateData.agency_fare_url = data.agency_fare_url
    }

    return await prisma.agency.update({
        where: {
            agency_id_project_id: {
                agency_id: agencyId,
                project_id: projectId
            }
        },
        data: updateData
    })
}

/**
 * Delete an agency
 * Note: This will fail if there are routes associated with this agency
 */
export async function deleteAgency(projectId, agencyId) {
    const existing = await prisma.agency.findFirst({
        where: {
            agency_id: agencyId,
            project_id: projectId
        },
        include: {
            routes: true
        }
    })

    if (!existing) {
        throw new Error("Agency not found in this project")
    }

    if (existing.routes.length > 0) {
        throw new Error("Cannot delete agency with associated routes. Please reassign or delete the routes first.")
    }

    await prisma.agency.delete({
        where: {
            agency_id_project_id: {
                agency_id: agencyId,
                project_id: projectId
            }
        }
    })

    return { success: true }
}

/**
 * Create a default agency for a project if none exists
 */
export async function ensureDefaultAgency(projectId, projectName = "My Transit Agency") {
    // Check if project has any agencies
    const existingCount = await prisma.agency.count({
        where: {
            project_id: projectId
        }
    })

    if (existingCount > 0) {
        // Return existing agencies
        return await prisma.agency.findMany({
            where: {
                project_id: projectId
            }
        })
    }

    // Create default agency
    const defaultAgency = await createAgency(projectId, {
        agency_name: projectName,
        agency_url: "https://example.com",
        agency_timezone: "Asia/Jakarta",
        agency_lang: "en"
    })

    return [defaultAgency]
}
