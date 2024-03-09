const conn = require('../utils/dbconn');


exports.getEmotions = async (req, res) => {
    const selectSQL = 'SELECT ed.emotion_name FROM emotion_details ed';
    conn.query(selectSQL, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            res.status(200);
            res.json({
                status: 'success',
                message: `${rows.length} records retrieved`,
                result: rows
            });
        }
    });
};


exports.getSingleEmotion = async (req, res) => {
    const emotion_name = req.params.emotion;
    const selectSQL = 'SELECT * FROM emotion_details ed WHERE ed.emotion_name = ? ';
    emotion_name_array = [emotion_name]
    conn.query(selectSQL, emotion_name_array, (err, rows) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'failure',
                message: err
            });
        } else {
            res.status(200);
            res.json({
                status: 'success',
                message: `${rows.length} records retrieved`,
                result: rows
            });
        }
    });
};

exports.postNewEmotions = async (req, res) => {
    const {
        anger_score, contempt_score, disgust_score, enjoyment_score, fear_score, sadness_score, surprise_score,
        trigger_array, sub_date_time
    } = req.body;

    const insertSQL = ``

};
// exports.postNewScore = (req, res) => {
//     const {anger, anger_score,
//         contempt, contempt_score,
//         disgust, disgust_score,
//         enjoyment, enjoyment_score,
//         fear, fear_score,
//         sadness, sadness_score,
//         surprise, surprise_score,
//         triggers
//     } = req.body;
//     const vals = [new_details, new_date];
//     const insertSQL = 'INSERT INTO runschedule (items, mydate) VALUES (?, ?)';
//     conn.query(insertSQL, vals, (err, rows) => {
//         if (err) {
//             res.status(500);
//             res.json({
//                 status: 'failure',
//                 message: err
//             });
//         } else {
//             res.status(201);
//             res.json({
//                 status: 'success',
//                 message: `Record ID ${rows.insertId} added`
//             });
//         }
//     });
// };
//
// exports.postNewScore = (req, res) => {
//     const {new_details, new_date} = req.body;
//     const vals = [new_details, new_date];
//     const insertSQL = 'INSERT INTO runschedule (items, mydate) VALUES (?, ?)';
//     conn.query(insertSQL, vals, (err, rows) => {
//         if (err) {
//             res.status(500);
//             res.json({
//                 status: 'failure',
//                 message: err
//             });
//         } else {
//             res.status(201);
//             res.json({
//                 status: 'success',
//                 message: `Record ID ${rows.insertId} added`
//             });
//         }
//     });
// };
//
// exports.selectRun = (req, res) => {
//     const {id} = req.params;
//
//     const selectSQL = `SELECT * FROM runschedule WHERE id = ${id}`;
//     conn.query(selectSQL, (err, rows) => {
//         if (err) {
//             res.status(500);
//             res.json({
//                 status: 'failure',
//                 message: err
//             });
//         } else {
//             if (rows.length > 0) {
//                 res.status(200);
//                 res.json({
//                     status: 'success',
//                     message: `Record ID ${id} retrieved`,
//                     result: rows
//                 });
//             } else {
//                 res.status(404);
//                 res.json({
//                     status: 'failure',
//                     message: `Invalid ID ${id}`
//                 });
//             }
//         }
//     });
// };
//
// exports.updateRun = (req, res) => {
//
//     const run_id = req.params.id;
//     const {run_details, run_date} = req.body;
//     const vals = [run_details, run_date, run_id];
//     const updateSQL = 'UPDATE runschedule SET items = ?, mydate = ? WHERE id = ? ';
//     conn.query(updateSQL, vals, (err, rows) => {
//         if (err) {
//             res.status(500);
//             res.json({
//                 status: 'failure',
//                 message: err
//             });
//         } else {
//             if (rows.affectedRows > 0) {
//                 res.status(200);
//                 res.json({
//                     status: 'success',
//                     message: `Record ID ${run_id} updated`
//                 });
//             } else {
//                 res.status(404);
//                 res.json({
//                     status: 'failure',
//                     message: `Invalid ID ${run_id}`
//                 });
//             }
//         }
//     });
// };
//
// exports.deleteRun = (req, res) => {
//
//     const run_id = req.params.id;
//     const deleteSQL = `DELETE FROM runschedule WHERE id = ${run_id}`;
//     conn.query(deleteSQL, (err, rows) => {
//         if (err) {
//             res.status(500);
//             res.json({
//                 status: 'failure',
//                 message: err
//             });
//         } else {
//             if (rows.affectedRows > 0) {
//                 res.status(200);
//                 res.json({
//                     status: 'success',
//                     message: `Record ID ${run_id} deleted`
//                 });
//             } else {
//                 res.status(404);
//                 res.json({
//                     status: 'failure',
//                     message: `Invalid ID ${run_id}`
//                 });
//             }
//         }
//     });
// };



