import pino from 'pino';

const transport = pino.transport({
      target: 'pino-pretty',
      options: {
          colorize: true,
          minimumLevel: process.env.LOG_LEVEL || "info"
      }
})

export default pino({level: process.env.LOG_LEVEL || "info"}, transport);