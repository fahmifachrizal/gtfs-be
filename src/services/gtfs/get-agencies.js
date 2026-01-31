import { prisma } from '../../utils/prisma.js';

// get all agencies for a project
export async function getAgencies(projectId) {
    const agencies = await prisma.agency.findMany({
        where: {
            project_id: projectId
        },
        select: {
            id: true,
            agency_id: true,
            agency_name: true,
            agency_url: true,
            agency_timezone: true,
            agency_lang: true,
            agency_phone: true,
            agency_fare_url: true,
            agency_email: true
        },
        orderBy: {
            agency_name: 'asc'
        }
    });

    return agencies;
}
