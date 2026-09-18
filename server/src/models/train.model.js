// Person 2 shared train-query model. Route/controller operations use the same pool.

const { pool } = require('../config/db');

class TrainModel {
  static async findByRoute(sourceCode, destinationCode) {
    const [rows] = await pool.query(
      `SELECT s.schedule_id, t.train_number, t.train_name, t.train_type, s.departure_time, s.arrival_time,
              s.total_seats_ac, s.total_seats_sleeper, s.fare_ac, s.fare_sleeper, s.running_days
       FROM schedules s JOIN trains t ON t.train_number = s.train_number
       WHERE s.source_station_code = ? AND s.destination_station_code = ? AND t.is_active = TRUE`,
      [sourceCode, destinationCode]
    );
    return rows;
  }
}

module.exports = TrainModel;
