import { prisma } from "../../utils/prisma.js"

export async function createStop(projectId, data) {
    const { stop_id, stop_name, stop_lat, stop_lon, stop_desc, stop_code, location_type, parent_station } = data

    // Validate coordinates
    if (stop_lat === undefined || stop_lon === undefined) {
        throw new Error("Latitude and Longitude are required")
    }

    // Generate stop_id if not provided
    const finalStopId = stop_id || `stop-${Date.now()}`

    return await prisma.stop.create({
        data: {
            stop_id: finalStopId,
            stop_name: stop_name || "New Stop",
            stop_lat: parseFloat(stop_lat),
            stop_lon: parseFloat(stop_lon),
            stop_desc,
            stop_code,
            location_type: location_type ? parseInt(location_type) : 0,
            parent_station,
            project_id: projectId
        }
    })
}

export async function updateStop(projectId, stopId, data) {
    // Ensure stop exists and belongs to project
    const existing = await prisma.stop.findFirst({
        where: {
            stop_id: stopId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Stop not found in this project")
    }

    const updateData = {}
    if (data.stop_name !== undefined) updateData.stop_name = data.stop_name
    if (data.stop_lat !== undefined) updateData.stop_lat = parseFloat(data.stop_lat)
    if (data.stop_lon !== undefined) updateData.stop_lon = parseFloat(data.stop_lon)
    if (data.stop_desc !== undefined) updateData.stop_desc = data.stop_desc
    if (data.stop_code !== undefined) updateData.stop_code = data.stop_code

    return await prisma.stop.update({
        where: {
            // Composite key or unique id expected. 
            // Prisma schema for GTFS usually uses composite key (stop_id, project_id) or a unique row ID.
            // Let's assume there is a unique ID or we use the composite unique constraint.
            // Adjusting based on common schema patterns:
            stop_id_project_id: {
                stop_id: stopId,
                project_id: projectId
            }
        },
        data: updateData
    })
}
