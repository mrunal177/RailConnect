-- SMART RAILWAY REALISTIC SEED DATA (POSTGRESQL)
-- 20+ realistic Indian railway trains, users, bookings, payments, complaints, feedback, and audit logs

-- 1. SEED USERS
INSERT INTO users (uid, name, email, phone, role) VALUES
('uid_mrunal_admin', 'Mrunal Baravkar', 'mrunal.r.baravkar@gmail.com', '+91 98230 45678', 'ADMIN'),
('uid_staff_arun', 'Arun Sharma (Duty Officer)', 'arun.staff@railway.gov.in', '+91 98110 12345', 'STAFF'),
('uid_passenger_priya', 'Priya Kulkarni', 'priya.k@gmail.com', '+91 97654 32109', 'PASSENGER'),
('uid_passenger_rohit', 'Rohit Verma', 'rohit.v@outlook.com', '+91 98221 65432', 'PASSENGER'),
('uid_passenger_ananya', 'Ananya Deshmukh', 'ananya.d@gmail.com', '+91 94220 99881', 'PASSENGER'),
('uid_passenger_vikram', 'Vikramaditya Roy', 'vikram.roy@yahoo.com', '+91 99300 11223', 'PASSENGER')
ON CONFLICT (uid) DO NOTHING;

-- 2. SEED TRAINS (All pairs between Mumbai, Delhi, Pune, Ahmedabad, Bengaluru, Chennai, Jaipur)
INSERT INTO trains (
    train_number, train_name, source, destination, departure_time, arrival_time, 
    duration, total_seats, train_type, classes, base_fare, train_status, 
    current_station, next_station, delay_minutes, speed_kmph
) VALUES
-- Mumbai <-> Delhi
('12951', 'Mumbai Rajdhani Express', 'Mumbai', 'Delhi', '17:00', '08:32', '15h 32m', 160, 'Rajdhani', '1A,2A,3A', 1450.00, 'ON_TIME', 'Surat', 'Vadodara', 7, 115),
('12953', 'August Kranti Tejas Rajdhani', 'Mumbai', 'Delhi', '17:10', '09:43', '16h 33m', 150, 'Rajdhani', '1A,2A,3A', 1380.00, 'ON_TIME', 'Vapi', 'Surat', 0, 110),
('22221', 'Mumbai CSMT Rajdhani Express', 'Mumbai', 'Delhi', '16:00', '09:55', '17h 55m', 140, 'Rajdhani', '1A,2A,3A', 1420.00, 'ON_TIME', 'Bhusawal', 'Bhopal', 5, 110),
('12925', 'Paschim Superfast Express', 'Mumbai', 'Delhi', '11:25', '10:40', '23h 15m', 150, 'Superfast', '1A,2A,3A,SL', 780.00, 'ON_TIME', 'Borivali', 'Surat', 0, 85),
('12909', 'BDTS NZM Garib Rath Express', 'Mumbai', 'Delhi', '17:30', '09:40', '16h 10m', 160, 'Garib Rath', '3A', 890.00, 'ON_TIME', 'Vadodara', 'Kota', 3, 105),
('12952', 'New Delhi Mumbai Rajdhani', 'Delhi', 'Mumbai', '16:55', '08:35', '15h 40m', 160, 'Rajdhani', '1A,2A,3A', 1450.00, 'ON_TIME', 'Kota', 'Ratlam', 2, 118),
('12954', 'August Kranti Tejas Express', 'Delhi', 'Mumbai', '17:15', '10:05', '16h 50m', 150, 'Rajdhani', '1A,2A,3A', 1380.00, 'ON_TIME', 'Mathura', 'Kota', 0, 112),
('22222', 'CSMT Rajdhani Express', 'Delhi', 'Mumbai', '16:55', '11:15', '18h 20m', 140, 'Rajdhani', '1A,2A,3A', 1420.00, 'ON_TIME', 'Gwalior', 'Bhopal', 4, 110),
('12926', 'Paschim Superfast Express', 'Delhi', 'Mumbai', '16:35', '14:55', '22h 20m', 150, 'Superfast', '1A,2A,3A,SL', 780.00, 'ON_TIME', 'Faridabad', 'Mathura', 0, 88),
-- Mumbai <-> Pune
('12123', 'Deccan Queen Superfast', 'Mumbai', 'Pune', '17:10', '20:25', '3h 15m', 120, 'Superfast', 'CC,2S', 345.00, 'ON_TIME', 'Lonavala', 'Shivajinagar', 4, 85),
('12127', 'CSMT Pune Intercity Express', 'Mumbai', 'Pune', '06:40', '09:57', '3h 17m', 120, 'Superfast', 'CC,2S', 315.00, 'ON_TIME', 'Karjat', 'Lonavala', 0, 80),
('11007', 'Deccan Express', 'Mumbai', 'Pune', '07:00', '11:05', '4h 05m', 130, 'Express', 'CC,2S', 290.00, 'ON_TIME', 'Thane', 'Kalyan', 0, 75),
('11009', 'Sinhagad Express', 'Mumbai', 'Pune', '17:50', '21:30', '3h 40m', 130, 'Express', 'CC,2S', 280.00, 'ON_TIME', 'Dadar', 'Kalyan', 5, 78),
('22225', 'Solapur Vande Bharat Express', 'Mumbai', 'Pune', '16:05', '19:10', '3h 05m', 112, 'Vande Bharat', 'EC,CC', 560.00, 'ON_TIME', 'Kalyan', 'Pune', 0, 110),
('11010', 'Sinhagad Express', 'Pune', 'Mumbai', '06:05', '09:55', '3h 50m', 130, 'Express', 'CC,2S', 280.00, 'DELAYED', 'Kalyan', 'Dadar', 14, 75),
('12128', 'Pune CSMT Intercity Express', 'Pune', 'Mumbai', '17:55', '21:05', '3h 10m', 120, 'Superfast', 'CC,2S', 315.00, 'ON_TIME', 'Thane', 'Dadar', 8, 82),
('12124', 'Deccan Queen Superfast', 'Pune', 'Mumbai', '07:15', '10:25', '3h 10m', 120, 'Superfast', 'CC,2S', 345.00, 'ON_TIME', 'Lonavala', 'Karjat', 0, 85),
('11008', 'Deccan Express', 'Pune', 'Mumbai', '15:15', '19:05', '3h 50m', 130, 'Express', 'CC,2S', 290.00, 'ON_TIME', 'Shivajinagar', 'Lonavala', 2, 78),
('22226', 'CSMT Vande Bharat Express', 'Pune', 'Mumbai', '09:15', '12:35', '3h 20m', 112, 'Vande Bharat', 'EC,CC', 560.00, 'ON_TIME', 'Lonavala', 'Kalyan', 0, 110),
-- Mumbai <-> Ahmedabad
('20901', 'Vande Bharat Express (Mumbai - Gandhinagar)', 'Mumbai', 'Ahmedabad', '06:00', '11:25', '5h 25m', 112, 'Vande Bharat', 'EC,CC', 1255.00, 'ON_TIME', 'Surat', 'Vadodara', 0, 130),
('12009', 'Shatabdi Express', 'Mumbai', 'Ahmedabad', '06:20', '12:45', '6h 25m', 140, 'Superfast', 'EC,CC', 980.00, 'ON_TIME', 'Bharuch', 'Vadodara', 6, 105),
('12931', 'Double Decker Express', 'Mumbai', 'Ahmedabad', '14:30', '21:25', '6h 55m', 160, 'Superfast', 'CC', 510.00, 'ON_TIME', 'Surat', 'Bharuch', 0, 95),
('12933', 'Karnavati Express', 'Mumbai', 'Ahmedabad', '14:05', '21:05', '7h 00m', 150, 'Superfast', 'CC,2S', 460.00, 'ON_TIME', 'Borivali', 'Vapi', 0, 90),
('20902', 'Vande Bharat Express (Gandhinagar - Mumbai)', 'Ahmedabad', 'Mumbai', '14:05', '19:35', '5h 30m', 112, 'Vande Bharat', 'EC,CC', 1255.00, 'ON_TIME', 'Vadodara', 'Surat', 0, 130),
('12010', 'Shatabdi Express', 'Ahmedabad', 'Mumbai', '15:10', '21:45', '6h 35m', 140, 'Superfast', 'EC,CC', 980.00, 'ON_TIME', 'Anand', 'Vadodara', 2, 105),
('12932', 'Double Decker Express', 'Ahmedabad', 'Mumbai', '06:00', '13:05', '7h 05m', 160, 'Superfast', 'CC', 510.00, 'ON_TIME', 'Bharuch', 'Surat', 5, 95),
('12934', 'Karnavati Express', 'Ahmedabad', 'Mumbai', '05:00', '12:20', '7h 20m', 150, 'Superfast', 'CC,2S', 460.00, 'ON_TIME', 'Vapi', 'Borivali', 0, 90),
-- Mumbai <-> Jaipur
('12955', 'Mumbai Jaipur Superfast', 'Mumbai', 'Jaipur', '19:05', '12:00', '16h 55m', 150, 'Superfast', '1A,2A,3A,SL', 1040.00, 'ON_TIME', 'Surat', 'Vadodara', 0, 90),
('12979', 'Bandra Terminus Jaipur Superfast', 'Mumbai', 'Jaipur', '17:05', '10:20', '17h 15m', 150, 'Superfast', '1A,2A,3A,SL', 1020.00, 'ON_TIME', 'Vapi', 'Surat', 0, 92),
('12956', 'Jaipur Mumbai Superfast Express', 'Jaipur', 'Mumbai', '14:00', '06:55', '16h 55m', 150, 'Superfast', '1A,2A,3A,SL', 1040.00, 'ON_TIME', 'Sawai Madhopur', 'Kota', 0, 90),
('12980', 'Jaipur Bandra Terminus Superfast', 'Jaipur', 'Mumbai', '20:25', '14:10', '17h 45m', 150, 'Superfast', '1A,2A,3A,SL', 1020.00, 'ON_TIME', 'Kota', 'Ratlam', 0, 92),
-- Mumbai <-> Bengaluru
('11301', 'Udyan Express', 'Mumbai', 'Bengaluru', '08:10', '06:00', '21h 50m', 140, 'Express', '1A,2A,3A,SL', 890.00, 'ON_TIME', 'Kalyan', 'Pune', 0, 80),
('11013', 'LTT Coimbatore Express via SBC', 'Mumbai', 'Bengaluru', '22:35', '21:50', '23h 15m', 140, 'Express', '2A,3A,SL', 840.00, 'ON_TIME', 'Thane', 'Pune', 0, 82),
('11302', 'Udyan Express', 'Bengaluru', 'Mumbai', '20:45', '19:45', '23h 00m', 140, 'Express', '1A,2A,3A,SL', 890.00, 'ON_TIME', 'Guntakal', 'Solapur', 0, 80),
('11014', 'Coimbatore LTT Express via SBC', 'Bengaluru', 'Mumbai', '16:00', '13:45', '21h 45m', 140, 'Express', '2A,3A,SL', 840.00, 'ON_TIME', 'Dharmavaram', 'Guntakal', 0, 82),
-- Mumbai <-> Chennai
('12163', 'Mumbai LTT Chennai Superfast', 'Mumbai', 'Chennai', '18:45', '16:25', '21h 40m', 140, 'Superfast', '1A,2A,3A,SL', 920.00, 'ON_TIME', 'Pune', 'Solapur', 0, 88),
('22157', 'Mumbai CSMT Chennai Mail', 'Mumbai', 'Chennai', '22:55', '22:15', '23h 20m', 140, 'Superfast', '1A,2A,3A,SL', 880.00, 'ON_TIME', 'Kalyan', 'Pune', 0, 85),
('12164', 'Chennai LTT Superfast Express', 'Chennai', 'Mumbai', '18:20', '15:50', '21h 30m', 140, 'Superfast', '1A,2A,3A,SL', 920.00, 'ON_TIME', 'Arakkonam', 'Renigunta', 0, 88),
('22158', 'Chennai CSMT Superfast Mail', 'Chennai', 'Mumbai', '06:20', '05:50', '23h 30m', 140, 'Superfast', '1A,2A,3A,SL', 880.00, 'ON_TIME', 'Renigunta', 'Guntakal', 0, 85),
-- Pune <-> Delhi
('12779', 'Goa Express via Pune', 'Pune', 'Delhi', '04:30', '06:25', '25h 55m', 150, 'Superfast', '2A,3A,SL', 940.00, 'ON_TIME', 'Daund', 'Manmad', 0, 85),
('12493', 'Pune Hazrat Nizamuddin AC Duronto', 'Pune', 'Delhi', '11:10', '06:55', '19h 45m', 140, 'Duronto', '1A,2A,3A', 1520.00, 'ON_TIME', 'Vasai Road', 'Surat', 0, 110),
('12780', 'Goa Express to Pune', 'Delhi', 'Pune', '15:15', '16:55', '25h 40m', 150, 'Superfast', '2A,3A,SL', 940.00, 'ON_TIME', 'Mathura', 'Agra', 0, 85),
('12494', 'Hazrat Nizamuddin Pune AC Duronto', 'Delhi', 'Pune', '21:40', '18:10', '20h 30m', 140, 'Duronto', '1A,2A,3A', 1520.00, 'ON_TIME', 'Kota', 'Vadodara', 0, 110),
-- Pune <-> Ahmedabad
('12298', 'Pune Ahmedabad AC Duronto Express', 'Pune', 'Ahmedabad', '21:35', '06:25', '8h 50m', 140, 'Duronto', '1A,2A,3A', 1120.00, 'ON_TIME', 'Lonavala', 'Vasai Road', 0, 95),
('11096', 'Ahimsa Express', 'Pune', 'Ahmedabad', '20:10', '07:20', '11h 10m', 140, 'Express', '2A,3A,SL', 490.00, 'ON_TIME', 'Kalyan', 'Surat', 0, 82),
('12297', 'Ahmedabad Pune AC Duronto Express', 'Ahmedabad', 'Pune', '22:30', '07:10', '8h 40m', 140, 'Duronto', '1A,2A,3A', 1120.00, 'ON_TIME', 'Surat', 'Vasai Road', 0, 95),
('11095', 'Ahimsa Express', 'Ahmedabad', 'Pune', '17:45', '04:35', '10h 50m', 140, 'Express', '2A,3A,SL', 490.00, 'ON_TIME', 'Vadodara', 'Surat', 0, 82),
-- Pune <-> Bengaluru
('16531', 'Ajmer Bengaluru Garib Nawaz Express via Pune', 'Pune', 'Bengaluru', '01:25', '02:30', '25h 05m', 140, 'Express', '2A,3A,SL', 720.00, 'ON_TIME', 'Satara', 'Miraj', 0, 75),
('11005', 'Chalukya Express via Pune', 'Pune', 'Bengaluru', '01:35', '21:15', '19h 40m', 140, 'Express', '2A,3A,SL', 680.00, 'ON_TIME', 'Daund', 'Solapur', 0, 78),
('16532', 'Bengaluru Ajmer Garib Nawaz Express via Pune', 'Bengaluru', 'Pune', '17:00', '18:15', '25h 15m', 140, 'Express', '2A,3A,SL', 720.00, 'ON_TIME', 'Tumakuru', 'Arsikere', 0, 75),
('11006', 'Chalukya Express via Pune', 'Bengaluru', 'Pune', '06:30', '01:10', '18h 40m', 140, 'Express', '2A,3A,SL', 680.00, 'ON_TIME', 'Hindupur', 'Dharmavaram', 0, 78),
-- Pune <-> Chennai
('12163', 'Chennai Superfast Express via Pune', 'Pune', 'Chennai', '22:45', '16:25', '17h 40m', 140, 'Superfast', '1A,2A,3A,SL', 780.00, 'ON_TIME', 'Solapur', 'Kalaburagi', 0, 85),
('22157', 'Chennai Mail via Pune', 'Pune', 'Chennai', '02:50', '22:15', '19h 25m', 140, 'Superfast', '1A,2A,3A,SL', 750.00, 'ON_TIME', 'Daund', 'Solapur', 0, 82),
('12164', 'Chennai LTT Superfast Express via Pune', 'Chennai', 'Pune', '18:20', '11:45', '17h 25m', 140, 'Superfast', '1A,2A,3A,SL', 780.00, 'ON_TIME', 'Renigunta', 'Guntakal', 0, 85),
('22158', 'Chennai CSMT Superfast Mail via Pune', 'Chennai', 'Pune', '06:20', '01:55', '19h 35m', 140, 'Superfast', '1A,2A,3A,SL', 750.00, 'ON_TIME', 'Arakkonam', 'Renigunta', 0, 82),
-- Pune <-> Jaipur
('12939', 'Pune Jaipur Superfast Express', 'Pune', 'Jaipur', '17:30', '13:40', '20h 10m', 150, 'Superfast', '1A,2A,3A,SL', 980.00, 'ON_TIME', 'Lonavala', 'Kalyan', 0, 90),
('12940', 'Jaipur Pune Superfast Express', 'Jaipur', 'Pune', '12:15', '08:05', '19h 50m', 150, 'Superfast', '1A,2A,3A,SL', 980.00, 'ON_TIME', 'Kota', 'Ratlam', 0, 90),
-- Delhi <-> Ahmedabad
('12958', 'Swarna Jayanti Rajdhani Express', 'Delhi', 'Ahmedabad', '20:55', '10:05', '13h 10m', 150, 'Rajdhani', '1A,2A,3A', 1390.00, 'ON_TIME', 'Gurgaon', 'Jaipur', 0, 110),
('12916', 'Ashram Superfast Express', 'Delhi', 'Ahmedabad', '15:20', '05:30', '14h 10m', 150, 'Superfast', '1A,2A,3A,SL', 620.00, 'ON_TIME', 'Delhi Cantt', 'Rewari', 0, 92),
('12957', 'Swarna Jayanti Rajdhani', 'Ahmedabad', 'Delhi', '17:45', '07:30', '13h 45m', 150, 'Rajdhani', '1A,2A,3A', 1390.00, 'ON_TIME', 'Jaipur', 'Gurgaon', 0, 112),
('12915', 'Ashram Superfast Express', 'Ahmedabad', 'Delhi', '19:15', '10:00', '14h 45m', 150, 'Superfast', '1A,2A,3A,SL', 620.00, 'ON_TIME', 'Palanpur', 'Abu Road', 0, 92),
-- Delhi <-> Jaipur
('12015', 'Ajmer Shatabdi Express', 'Delhi', 'Jaipur', '06:10', '10:40', '4h 30m', 130, 'Superfast', 'EC,CC', 780.00, 'ON_TIME', 'Rewari', 'Alwar', 5, 95),
('20977', 'Vande Bharat Express (Delhi - Jaipur)', 'Delhi', 'Jaipur', '06:20', '10:15', '3h 55m', 112, 'Vande Bharat', 'EC,CC', 1050.00, 'ON_TIME', 'Gurgaon', 'Alwar', 0, 120),
('12986', 'Double Decker Express', 'Delhi', 'Jaipur', '17:35', '22:05', '4h 30m', 150, 'Superfast', 'CC', 490.00, 'ON_TIME', 'Rewari', 'Alwar', 0, 95),
('12016', 'Ajmer New Delhi Shatabdi Express', 'Jaipur', 'Delhi', '17:45', '22:30', '4h 45m', 130, 'Superfast', 'EC,CC', 780.00, 'ON_TIME', 'Alwar', 'Rewari', 0, 95),
('20978', 'Vande Bharat Express (Jaipur - Delhi)', 'Jaipur', 'Delhi', '15:45', '19:40', '3h 55m', 112, 'Vande Bharat', 'EC,CC', 1050.00, 'ON_TIME', 'Alwar', 'Gurgaon', 0, 120),
('12985', 'Jaipur Delhi Double Decker', 'Jaipur', 'Delhi', '06:00', '10:25', '4h 25m', 150, 'Superfast', 'CC', 490.00, 'ON_TIME', 'Dausa', 'Alwar', 0, 95),
-- Delhi <-> Bengaluru
('12628', 'Karnataka Express', 'Delhi', 'Bengaluru', '20:20', '12:00', '39h 40m', 150, 'Superfast', '1A,2A,3A,SL', 1250.00, 'ON_TIME', 'Agra Cantt', 'Gwalior', 0, 90),
('22692', 'Bengaluru Rajdhani Express', 'Delhi', 'Bengaluru', '20:45', '05:20', '32h 35m', 150, 'Rajdhani', '1A,2A,3A', 2150.00, 'ON_TIME', 'Gwalior', 'Bhopal', 0, 110),
('12627', 'Karnataka Express', 'Bengaluru', 'Delhi', '19:20', '10:30', '39h 10m', 150, 'Superfast', '1A,2A,3A,SL', 1250.00, 'ON_TIME', 'Hindupur', 'Guntakal', 0, 90),
('22691', 'Bengaluru Rajdhani Express', 'Bengaluru', 'Delhi', '20:00', '05:30', '33h 30m', 150, 'Rajdhani', '1A,2A,3A', 2150.00, 'ON_TIME', 'Guntakal', 'Nagpur', 0, 110),
-- Delhi <-> Chennai
('12616', 'Grand Trunk (GT) Express', 'Delhi', 'Chennai', '16:10', '04:30', '36h 20m', 150, 'Superfast', '1A,2A,3A,SL', 1180.00, 'ON_TIME', 'Mathura', 'Agra', 0, 88),
('12622', 'Tamil Nadu Express', 'Delhi', 'Chennai', '21:05', '06:15', '33h 10m', 150, 'Superfast', '1A,2A,3A,SL', 1200.00, 'ON_TIME', 'Agra', 'Gwalior', 0, 95),
('12615', 'Grand Trunk (GT) Express', 'Chennai', 'Delhi', '18:50', '06:35', '35h 45m', 150, 'Superfast', '1A,2A,3A,SL', 1180.00, 'ON_TIME', 'Gudur', 'Nellore', 0, 88),
('12621', 'Tamil Nadu Express', 'Chennai', 'Delhi', '22:00', '07:05', '33h 05m', 150, 'Superfast', '1A,2A,3A,SL', 1200.00, 'ON_TIME', 'Vijayawada', 'Warangal', 0, 95),
-- Ahmedabad <-> Jaipur
('12548', 'Sabarmati Agra Cantt Superfast via Jaipur', 'Ahmedabad', 'Jaipur', '16:55', '03:00', '10h 05m', 140, 'Superfast', '2A,3A,SL', 460.00, 'ON_TIME', 'Mahesana', 'Palanpur', 0, 85),
('12547', 'Agra Cantt Sabarmati Superfast via Jaipur', 'Jaipur', 'Ahmedabad', '01:50', '11:55', '10h 05m', 140, 'Superfast', '2A,3A,SL', 460.00, 'ON_TIME', 'Ajmer', 'Abu Road', 0, 85),
-- Ahmedabad <-> Bengaluru
('16501', 'Ahmedabad Yesvantpur Weekly Express', 'Ahmedabad', 'Bengaluru', '19:00', '04:30', '33h 30m', 140, 'Express', '2A,3A,SL', 890.00, 'ON_TIME', 'Vadodara', 'Surat', 0, 80),
('16502', 'Yesvantpur Ahmedabad Weekly Express', 'Bengaluru', 'Ahmedabad', '13:30', '22:50', '33h 20m', 140, 'Express', '2A,3A,SL', 890.00, 'ON_TIME', 'Tumakuru', 'Arsikere', 0, 80),
-- Ahmedabad <-> Chennai
('12655', 'Navjeevan Express', 'Ahmedabad', 'Chennai', '07:35', '16:05', '32h 30m', 140, 'Superfast', '1A,2A,3A,SL', 980.00, 'ON_TIME', 'Anand', 'Vadodara', 0, 85),
('12656', 'Navjeevan Express', 'Chennai', 'Ahmedabad', '10:10', '18:00', '31h 50m', 140, 'Superfast', '1A,2A,3A,SL', 980.00, 'ON_TIME', 'Gudur', 'Vijayawada', 0, 85),
-- Bengaluru <-> Chennai
('12028', 'Shatabdi Express (Bengaluru - Chennai)', 'Bengaluru', 'Chennai', '06:00', '11:00', '5h 00m', 120, 'Superfast', 'EC,CC', 820.00, 'ON_TIME', 'Katpadi', 'Arakkonam', 0, 100),
('20608', 'Vande Bharat Express (Mysuru - Chennai)', 'Bengaluru', 'Chennai', '14:50', '19:30', '4h 40m', 112, 'Vande Bharat', 'EC,CC', 1100.00, 'ON_TIME', 'Jolarpettai', 'Katpadi', 3, 125),
('12608', 'Lalbagh Superfast Express', 'Bengaluru', 'Chennai', '06:20', '12:15', '5h 55m', 140, 'Superfast', 'CC,2S', 240.00, 'ON_TIME', 'Bangarapet', 'Katpadi', 0, 88),
('12027', 'Shatabdi Express (Chennai - Bengaluru)', 'Chennai', 'Bengaluru', '17:30', '22:25', '4h 55m', 120, 'Superfast', 'EC,CC', 820.00, 'ON_TIME', 'Katpadi', 'Jolarpettai', 0, 100),
('20607', 'Vande Bharat Express (Chennai - Mysuru)', 'Chennai', 'Bengaluru', '05:50', '10:25', '4h 35m', 112, 'Vande Bharat', 'EC,CC', 1100.00, 'ON_TIME', 'Arakkonam', 'Katpadi', 0, 125),
('12607', 'Lalbagh Superfast Express', 'Chennai', 'Bengaluru', '15:30', '21:35', '6h 05m', 140, 'Superfast', 'CC,2S', 240.00, 'ON_TIME', 'Arakkonam', 'Katpadi', 0, 88),
-- Bengaluru <-> Jaipur
('12975', 'Mysuru Jaipur Superfast via SBC', 'Bengaluru', 'Jaipur', '13:00', '06:15', '41h 15m', 150, 'Superfast', '1A,2A,3A,SL', 1280.00, 'ON_TIME', 'Hindupur', 'Guntakal', 0, 85),
('12976', 'Jaipur Mysuru Superfast via SBC', 'Jaipur', 'Bengaluru', '19:35', '13:00', '41h 25m', 150, 'Superfast', '1A,2A,3A,SL', 1280.00, 'ON_TIME', 'Sawai Madhopur', 'Kota', 0, 85),
-- Chennai <-> Jaipur
('12967', 'Chennai Central Jaipur Superfast', 'Chennai', 'Jaipur', '17:40', '06:45', '37h 05m', 150, 'Superfast', '1A,2A,3A,SL', 1260.00, 'ON_TIME', 'Gudur', 'Vijayawada', 0, 88),
('12968', 'Jaipur Chennai Central Superfast', 'Jaipur', 'Chennai', '19:35', '08:20', '36h 45m', 150, 'Superfast', '1A,2A,3A,SL', 1260.00, 'ON_TIME', 'Kota', 'Nagpur', 0, 88)
ON CONFLICT (train_number) DO NOTHING;

-- 3. SEED SEATS & BOOKINGS (Realistic historical records)
-- Let's insert confirmed bookings for user Priya and Rohit
DO $$
DECLARE
    v_user_priya_id INTEGER;
    v_user_rohit_id INTEGER;
    v_train_rajdhani_id INTEGER;
    v_train_deccan_id INTEGER;
    v_booking_1 INTEGER;
    v_booking_2 INTEGER;
    v_booking_3 INTEGER;
BEGIN
    SELECT id INTO v_user_priya_id FROM users WHERE email = 'priya.k@gmail.com' LIMIT 1;
    SELECT id INTO v_user_rohit_id FROM users WHERE email = 'rohit.v@outlook.com' LIMIT 1;
    SELECT id INTO v_train_rajdhani_id FROM trains WHERE train_number = '12951' LIMIT 1;
    SELECT id INTO v_train_deccan_id FROM trains WHERE train_number = '12123' LIMIT 1;

    -- Booking 1: Priya on Mumbai Rajdhani
    INSERT INTO bookings (
        user_id, train_id, pnr, journey_date, passenger_name, passenger_age, 
        passenger_gender, seat_number, travel_class, fare, booking_status
    ) VALUES (
        v_user_priya_id, v_train_rajdhani_id, 'SR7K29X4', '2026-09-28', 'Priya Kulkarni', 29, 
        'Female', 'B2-24', '3A', 1450.00, 'CONFIRMED'
    ) ON CONFLICT (pnr) DO NOTHING RETURNING id INTO v_booking_1;

    IF v_booking_1 IS NOT NULL THEN
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_reference)
        VALUES (v_booking_1, 1450.00, 'UPI', 'SUCCESS', 'TXN_UPI_992100881')
        ON CONFLICT (transaction_reference) DO NOTHING;

        INSERT INTO feedback (user_id, booking_id, rating, comment, sentiment, sentiment_confidence)
        VALUES (v_user_priya_id, v_booking_1, 5, 'The train was remarkably clean and the staff was courteous and punctual!', 'POSITIVE', 96);
    END IF;

    -- Booking 2: Rohit on Deccan Queen
    INSERT INTO bookings (
        user_id, train_id, pnr, journey_date, passenger_name, passenger_age, 
        passenger_gender, seat_number, travel_class, fare, booking_status
    ) VALUES (
        v_user_rohit_id, v_train_deccan_id, 'SR8M31P9', '2026-09-29', 'Rohit Verma', 34, 
        'Male', 'C1-12', 'CC', 345.00, 'CONFIRMED'
    ) ON CONFLICT (pnr) DO NOTHING RETURNING id INTO v_booking_2;

    IF v_booking_2 IS NOT NULL THEN
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_reference)
        VALUES (v_booking_2, 345.00, 'CARD', 'SUCCESS', 'TXN_CARD_4490123')
        ON CONFLICT (transaction_reference) DO NOTHING;

        INSERT INTO complaints (user_id, booking_id, category, description, status, priority, assigned_staff)
        VALUES (v_user_rohit_id, v_booking_2, 'Train Delay', 'Train was delayed by 14 minutes near monkey hill junction.', 'IN_PROGRESS', 'MEDIUM', 'Arun Sharma (Duty Officer)');
    END IF;

    -- Seed sample inventory seats
    INSERT INTO seats (train_id, journey_date, seat_number, travel_class, is_booked, booked_by_user_id, booking_id)
    VALUES 
    (v_train_rajdhani_id, '2026-09-28', 'A1', '3A', true, v_user_priya_id, v_booking_1),
    (v_train_rajdhani_id, '2026-09-28', 'A2', '3A', false, NULL, NULL),
    (v_train_rajdhani_id, '2026-09-28', 'B1', '3A', false, NULL, NULL),
    (v_train_rajdhani_id, '2026-09-28', 'B2', '3A', true, v_user_priya_id, v_booking_1)
    ON CONFLICT (train_id, journey_date, seat_number) DO NOTHING;
END $$;
