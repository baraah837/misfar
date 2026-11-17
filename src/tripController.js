// controllers/tripController.js
const { query, getClient } = require('../config/db');

// ── GET /api/trips  –  user's own trips ──────────────────────
exports.getMyTrips = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT t.*,
        json_agg(
          jsonb_build_object(
            'id', ts.id,
            'stop_order', ts.stop_order,
            'place', COALESCE(d.name, ts.custom_place),
            'destination_id', ts.destination_id,
            'arrival_time', ts.arrival_time,
            'duration_hours', ts.duration_hours,
            'notes', ts.notes
          ) ORDER BY ts.stop_order
        ) FILTER (WHERE ts.id IS NOT NULL) AS stops
      FROM trips t
      LEFT JOIN trip_stops ts ON ts.trip_id = t.id
      LEFT JOIN destinations d ON d.id = ts.destination_id
      WHERE t.user_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// ── GET /api/trips/:id ────────────────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT t.*,
        json_agg(
          jsonb_build_object(
            'id', ts.id,
            'stop_order', ts.stop_order,
            'place', COALESCE(d.name, ts.custom_place),
            'destination_id', ts.destination_id,
            'photo', (SELECT photo_url FROM destination_photos WHERE destination_id = d.id AND is_primary = TRUE LIMIT 1),
            'arrival_time', ts.arrival_time,
            'duration_hours', ts.duration_hours,
            'notes', ts.notes
          ) ORDER BY ts.stop_order
        ) FILTER (WHERE ts.id IS NOT NULL) AS stops
      FROM trips t
      LEFT JOIN trip_stops ts ON ts.trip_id = t.id
      LEFT JOIN destinations d ON d.id = ts.destination_id
      WHERE t.id = $1 AND t.user_id = $2
      GROUP BY t.id
    `, [req.params.id, req.user.id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ── POST /api/trips  –  save a manual trip ────────────────────
exports.create = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { title, trip_date, duration_days, budget_level, travel_type, total_cost_omr, notes, stops = [] } = req.body;

    const tripResult = await client.query(`
      INSERT INTO trips (user_id, title, trip_date, duration_days, budget_level, travel_type, total_cost_omr, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [req.user.id, title, trip_date || null, duration_days || null, budget_level || null, travel_type || null, total_cost_omr || null, notes || null]);

    const trip = tripResult.rows[0];

    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      await client.query(`
        INSERT INTO trip_stops (trip_id, destination_id, custom_place, stop_order, arrival_time, duration_hours, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [trip.id, s.destination_id || null, s.custom_place || null, i + 1, s.arrival_time || null, s.duration_hours || null, s.notes || null]);
    }

    for (const s of stops) {
      if (s.destination_id) {
        await client.query(
          `INSERT INTO user_behavior (user_id, destination_id, action) VALUES ($1,$2,'trip')`,
          [req.user.id, s.destination_id]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Trip saved.', data: trip });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ── PUT /api/trips/:id ────────────────────────────────────────
exports.update = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { title, trip_date, duration_days, budget_level, travel_type, total_cost_omr, notes, stops } = req.body;

    const tripResult = await client.query(`
      UPDATE trips
      SET title=$1, trip_date=$2, duration_days=$3, budget_level=$4,
          travel_type=$5, total_cost_omr=$6, notes=$7
      WHERE id=$8 AND user_id=$9
      RETURNING *
    `, [title, trip_date, duration_days, budget_level, travel_type, total_cost_omr, notes, req.params.id, req.user.id]);

    if (!tripResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (stops) {
      await client.query('DELETE FROM trip_stops WHERE trip_id = $1', [req.params.id]);
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        await client.query(`
          INSERT INTO trip_stops (trip_id, destination_id, custom_place, stop_order, arrival_time, duration_hours, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [req.params.id, s.destination_id || null, s.custom_place || null, i + 1, s.arrival_time || null, s.duration_hours || null, s.notes || null]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Trip updated.', data: tripResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ── DELETE /api/trips/:id ─────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    res.json({ success: true, message: 'Trip deleted.' });
  } catch (err) { next(err); }
};

// ── POST /api/trips/ai-generate ───────────────────────────────
exports.aiGenerate = async (req, res, next) => {
  try {
    const { region, duration, budget, interests = [], travel_type } = req.body;

    // Map frontend interest labels → DB category values
    // DB categories from seed: Historic, Nature, Adventure, Beach
    const interestToCategoryMap = {
      'Beaches':   ['Beach', 'Nature'],
      'Mountains': ['Nature', 'Adventure'],
      'Historic':  ['Historic'],
      'Desert':    ['Adventure', 'Nature'],
      'Adventure': ['Adventure', 'Nature'],
    };

    // Collect all matching categories (union, not intersection)
    const categorySet = new Set();
    if (interests.length > 0) {
      interests.forEach(i => {
        const cats = interestToCategoryMap[i] || [i];
        cats.forEach(c => categorySet.add(c));
      });
    }
    const categories = [...categorySet];

    // ── Build query dynamically ──────────────────────────────
    let conditions = ['d.is_active = TRUE'];
    const params = [];

    // Region filter — only apply if region is provided and not "All"
    if (region && region !== 'All') {
      // Map frontend region labels to DB region values
      const regionMap = {
        'Muscat':       'Muscat',
        'Dhofar':       'Dhofar',
        'Al Dakhiliya': 'Al Dakhiliya',
        'Musandam':     'Musandam',
        'Al Buraimi':   'Al Buraimi',
        'Al Sharqiya':  'Al Sharqiya',
      };
      const dbRegion = regionMap[region] || region;
      params.push(dbRegion);
      conditions.push(`d.region = $${params.length}`);
    }

    // Interest/category filter — OR match (destination matches ANY selected category)
    if (categories.length > 0) {
      params.push(categories);
      conditions.push(`d.category = ANY($${params.length})`);
    }

    const destQuery = `
      SELECT d.id, d.name, d.area, d.region, d.category, d.avg_rating,
             d.opening_hours, d.entry_fee, d.overview,
             (SELECT photo_url FROM destination_photos
              WHERE destination_id = d.id AND is_primary = TRUE LIMIT 1) AS photo
      FROM destinations d
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.avg_rating DESC NULLS LAST, d.name ASC
      LIMIT 20
    `;

    let dests = (await query(destQuery, params)).rows;

    // ── Fallback: if no results with region filter, drop region and retry ──
    if (dests.length === 0 && region && region !== 'All') {
      const fallbackConditions = ['d.is_active = TRUE'];
      const fallbackParams = [];
      if (categories.length > 0) {
        fallbackParams.push(categories);
        fallbackConditions.push(`d.category = ANY($${fallbackParams.length})`);
      }
      dests = (await query(
        `SELECT d.id, d.name, d.area, d.region, d.category, d.avg_rating,
                d.opening_hours, d.entry_fee, d.overview,
                (SELECT photo_url FROM destination_photos
                 WHERE destination_id = d.id AND is_primary = TRUE LIMIT 1) AS photo
         FROM destinations d
         WHERE ${fallbackConditions.join(' AND ')}
         ORDER BY d.avg_rating DESC NULLS LAST LIMIT 20`,
        fallbackParams
      )).rows;
    }

    // ── Last resort: return all active destinations ──
    if (dests.length === 0) {
      dests = (await query(
        `SELECT d.id, d.name, d.area, d.region, d.category, d.avg_rating,
                d.opening_hours, d.entry_fee, d.overview,
                (SELECT photo_url FROM destination_photos
                 WHERE destination_id = d.id AND is_primary = TRUE LIMIT 1) AS photo
         FROM destinations d WHERE d.is_active = TRUE
         ORDER BY d.avg_rating DESC NULLS LAST LIMIT 20`
      )).rows;
    }

    if (dests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No destinations found. Please run the database seed first (node config/seed.js).'
      });
    }

    // ── Build day-by-day itinerary ──────────────────────────
    const days = Math.max(1, parseInt(duration) || 2);
    const TIMES_MORNING   = ['8:00 AM', '9:00 AM'];
    const TIMES_AFTERNOON = ['2:00 PM', '3:00 PM'];
    const itinerary = [];
    const usedIds = new Set();
    const transportCostPerDay = budget === 'Low' ? 10 : budget === 'Medium' ? 25 : 50;
    let totalCost = 0;

    // Sort destinations: prioritize ones matching the selected categories first
    const sortedDests = [...dests].sort((a, b) => {
      const aMatch = categories.includes(a.category) ? 0 : 1;
      const bMatch = categories.includes(b.category) ? 0 : 1;
      return aMatch - bMatch;
    });

    for (let day = 1; day <= days; day++) {
      const dayStops = [];

      // Morning stop
      const morningDest = sortedDests.find(d => !usedIds.has(d.id));
      if (morningDest) {
        usedIds.add(morningDest.id);
        totalCost += parseFloat(morningDest.entry_fee || 0);
        dayStops.push({
          time: TIMES_MORNING[day % 2],
          destination: morningDest,
          duration: '2-3 hours',
          notes: morningDest.opening_hours ? `Open: ${morningDest.opening_hours}` : null,
        });
      }

      // Lunch break
      dayStops.push({
        time: '1:00 PM',
        destination: null,
        custom_place: 'Lunch / Local Restaurant',
        duration: '1 hour',
        notes: 'Enjoy authentic Omani cuisine 🍽',
      });

      // Afternoon stop
      const afternoonDest = sortedDests.find(d => !usedIds.has(d.id));
      if (afternoonDest) {
        usedIds.add(afternoonDest.id);
        totalCost += parseFloat(afternoonDest.entry_fee || 0);
        dayStops.push({
          time: TIMES_AFTERNOON[day % 2],
          destination: afternoonDest,
          duration: '2-3 hours',
          notes: afternoonDest.opening_hours ? `Open: ${afternoonDest.opening_hours}` : null,
        });
      }

      totalCost += transportCostPerDay;
      itinerary.push({ day, stops: dayStops });
    }

    res.json({
      success: true,
      data: {
        itinerary,
        summary: {
          days,
          region: region || 'Oman',
          budget,
          travel_type,
          interests,
          estimated_cost_omr: parseFloat(totalCost.toFixed(3)),
          destinations_count: usedIds.size,
        },
      },
    });
  } catch (err) { next(err); }
};
