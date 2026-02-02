import { prisma } from "../../utils/prisma.js"

export async function createFare(projectId, data, userId = null) {
    const {
        fare_id,
        price,
        currency_type,
        payment_method,
        transfers,
        agency_id,
        transfer_duration
    } = data

    if (!fare_id || price === undefined || !currency_type || payment_method === undefined) {
        throw new Error("Fare ID, price, currency type, and payment method are required")
    }

    return await prisma.fareAttribute.create({
        data: {
            fare_id,
            price: parseFloat(price),
            currency_type,
            payment_method: parseInt(payment_method),
            transfers: transfers !== undefined ? parseInt(transfers) : null,
            agency_id: agency_id || null,
            transfer_duration: transfer_duration ? parseInt(transfer_duration) : null,
            project_id: projectId,
            created_by: userId
        }
    })
}

export async function updateFare(projectId, fareId, data, userId = null) {
    const existing = await prisma.fareAttribute.findFirst({
        where: {
            fare_id: fareId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Fare not found in this project")
    }

    const updateData = {}
    if (data.price !== undefined) updateData.price = parseFloat(data.price)
    if (data.currency_type !== undefined) updateData.currency_type = data.currency_type
    if (data.payment_method !== undefined) updateData.payment_method = parseInt(data.payment_method)
    if (data.transfers !== undefined) updateData.transfers = data.transfers !== null ? parseInt(data.transfers) : null
    if (data.agency_id !== undefined) updateData.agency_id = data.agency_id || null
    if (data.transfer_duration !== undefined) updateData.transfer_duration = data.transfer_duration ? parseInt(data.transfer_duration) : null

    return await prisma.fareAttribute.update({
        where: {
            fare_id_project_id: {
                fare_id: fareId,
                project_id: projectId
            }
        },
        data: updateData
    })
}

export async function deleteFare(projectId, fareId) {
    const existing = await prisma.fareAttribute.findFirst({
        where: {
            fare_id: fareId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Fare not found in this project")
    }

    // Delete associated fare rules first
    await prisma.fareRule.deleteMany({
        where: {
            fare_id: fareId,
            project_id: projectId
        }
    })

    return await prisma.fareAttribute.delete({
        where: {
            fare_id_project_id: {
                fare_id: fareId,
                project_id: projectId
            }
        }
    })
}

// Fare Rules CRUD
export async function createFareRule(projectId, data, userId = null) {
    const { fare_id, route_id, origin_id, destination_id, contains_id } = data

    if (!fare_id) {
        throw new Error("Fare ID is required")
    }

    return await prisma.fareRule.create({
        data: {
            fare_id,
            route_id: route_id || null,
            origin_id: origin_id || null,
            destination_id: destination_id || null,
            contains_id: contains_id || null,
            project_id: projectId,
            created_by: userId
        }
    })
}

export async function deleteFareRule(projectId, ruleId) {
    const existing = await prisma.fareRule.findFirst({
        where: {
            id: ruleId,
            project_id: projectId
        }
    })

    if (!existing) {
        throw new Error("Fare rule not found in this project")
    }

    return await prisma.fareRule.delete({
        where: { id: ruleId }
    })
}
