import { prisma } from "../../utils/prisma.js"

export async function createCalendar(projectId, data) {
    const {
        service_id,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        start_date,
        end_date
    } = data

    if (!service_id || !start_date || !end_date) {
        throw new Error("Service ID, start date, and end date are required")
    }

    return await prisma.calendar.create({
        data: {
            service_id,
            monday: parseInt(monday) || 0,
            tuesday: parseInt(tuesday) || 0,
            wednesday: parseInt(wednesday) || 0,
            thursday: parseInt(thursday) || 0,
            friday: parseInt(friday) || 0,
            saturday: parseInt(saturday) || 0,
            sunday: parseInt(sunday) || 0,
            start_date,
            end_date,
            project_id: projectId
        }
    })
}

export async function updateCalendar(projectId, serviceId, data) {
    const existing = await prisma.calendar.findFirst({
        where: {
            service_id: serviceId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Calendar not found in this project")
    }

    const updateData = {}
    if (data.monday !== undefined) updateData.monday = parseInt(data.monday)
    if (data.tuesday !== undefined) updateData.tuesday = parseInt(data.tuesday)
    if (data.wednesday !== undefined) updateData.wednesday = parseInt(data.wednesday)
    if (data.thursday !== undefined) updateData.thursday = parseInt(data.thursday)
    if (data.friday !== undefined) updateData.friday = parseInt(data.friday)
    if (data.saturday !== undefined) updateData.saturday = parseInt(data.saturday)
    if (data.sunday !== undefined) updateData.sunday = parseInt(data.sunday)
    if (data.start_date !== undefined) updateData.start_date = data.start_date
    if (data.end_date !== undefined) updateData.end_date = data.end_date

    return await prisma.calendar.update({
        where: {
            service_id_project_id: {
                service_id: serviceId,
                project_id: projectId
            }
        },
        data: updateData
    })
}

export async function deleteCalendar(projectId, serviceId) {
    const existing = await prisma.calendar.findFirst({
        where: {
            service_id: serviceId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Calendar not found in this project")
    }

    return await prisma.calendar.delete({
        where: {
            service_id_project_id: {
                service_id: serviceId,
                project_id: projectId
            }
        }
    })
}
