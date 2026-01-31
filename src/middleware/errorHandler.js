export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    const statusCode = err.status || 500;
    const errorMessage = err.message || 'Internal Server Error';
    const errorTitle = err.name || 'Server Error';

    res.status(statusCode).json({
        status: false,
        errorMessage,
        errorTitle
    });
};
