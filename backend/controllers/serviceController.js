import Service from "../models/Service.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

//helper function
const parseJsonArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
      return typeof parsed === "string" ? [parsed] : [];
    } catch {
      return field
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

function normalizeSlotsToMap(slotStrings = []) {
  const map = {};
  slotStrings.forEach((raw) => {
    const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*•\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) {
      // fallback: keep raw in an "unspecified" bucket
      map["unspecified"] = map["unspecified"] || [];
      map["unspecified"].push(raw);
      return;
    }
    const [, day, monShort, year, hour, minute, ampm] = m;
    const monthIdx = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      .findIndex(x => x.toLowerCase() === monShort.toLowerCase());
    const mm = String(monthIdx + 1).padStart(2, "0");
    const dd = String(Number(day)).padStart(2, "0");
    const dateKey = `${year}-${mm}-${dd}`; // YYYY-MM-DD
    const timeStr = `${String(Number(hour)).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm.toUpperCase()}`;
    map[dateKey] = map[dateKey] || [];
    map[dateKey].push(timeStr);
  });
  return map;
}

const sanitizePrice = (v) => Number(String(v ?? "0").replace(/[^\d.-]/g, "")) || 0;
const parseAvailability = (v) => {
  const s = String(v ?? "available").toLowerCase();
  return s === "available" || s === "true";
};
    
// to create service
export async function createService(req, res){
    try {
        const b = req.body || {};
    const instructions = parseJsonArrayField(b.instructions);
    const rawSlots = parseJsonArrayField(b.slots);
    const slots = normalizeSlotsToMap(rawSlots);
    const numericPrice = sanitizePrice(b.price);
    const available = parseAvailability(b.availability);

    let imageUrl = null;
    let imagePublicId = null;
    if (req.file) {
      try {
        const up = await uploadToCloudinary(req.file.path, "services");
        imageUrl = up?.secure_url || null;
        imagePublicId = up?.public_id || null;
      } catch (err) {
        console.error("Cloudinary upload error:", err);
      }
    }
    
    const service = new Service({
        name: b.name,
        about: b.about || "",
        shortDescription: b.shortDescription || "",
        price: numericPrice,
        available,
        instructions,
        slots,
        imageUrl,
        imagePublicId
    });

    const save = await service.save();
    return res.status(201).json({
        success: true,
        data: save,
        message: "Service Created successfully" 
    });


    } catch (err) {
        console.error("Create Service Error:", err);
        return res.status(500).json({
            success: false,
            message: "server error"
        });
    }
}

// get the all Service

export async function getService(req, res){

    try {
        const list = await Service.find().sort ({createdAt: -1 }).lean();
        return res.status(200).json({
            success: true,
            data: list
        });


     } catch (err) {
        console.error("getService Error:", err);
        return res.status(500).json({
            success: false,
            message: "server error"
        });
}
}

// server to get by id    

export async function getServiceById(req, res){
    try {
        const { id } = req.params;
        const service = await Service.findById(id).lean();
        if(!service) return res.status(404).json({
            success: false,
            message: "Service Not Found"
        });

        return res.status(200).json({
            success: true,
            data: service
        })


    } catch (err) {
        console.error("getServiceByID Error:", err);
        return res.status(500).json({
            success: false,
            message: "server error"
        });
}
}

//updata service
export async function updateService(req, res) {
    try {
       const { id } = req.params;
       const existing = await Service.findById(id);
       if(!existing) return res.status(404).json({
         success: false,
            message: "server Not Found"
       });

       const b = req.body || {};
       const updateData = {};

// to update each field  

 
    if (b.name !== undefined) updateData.name = b.name;
    if (b.about !== undefined) updateData.about = b.about;
    if (b.shortDescription !== undefined) updateData.shortDescription = b.shortDescription;
    if (b.price !== undefined) updateData.price = sanitizePrice(b.price);
    if (b.availability !== undefined) updateData.available = parseAvailability(b.availability);
    if (b.instructions !== undefined) updateData.instructions = parseJsonArrayField(b.instructions);
    if (b.slots !== undefined) updateData.slots = normalizeSlotsToMap(parseJsonArrayField(b.slots));

    if (req.file) {
      try {
        const up = await uploadToCloudinary(req.file.path, "services");
        if (up?.secure_url) {
          updateData.imageUrl = up.secure_url;
          updateData.imagePublicId = up.public_id || null;
          if (existing.imagePublicId) {
            try {
              await deleteFromCloudinary(existing.imagePublicId);
            } catch (err) {
              console.warn("Cloudinary delete failed:", err?.message || err);
            }
          }
        }
      } catch (err) {
        console.error("Cloudinary upload error:", err);
      }
    }

    const update = await Service.findByIdAndUpdate(id, updateData, {new: true,
        runValidators: true
    });

    return res.status(200).json({
        success: true,
        data: updateData,
        message: "Service Updated"
    })

        

       } catch (err) {
        console.error("UpdateService  Error:", err);
        return res.status(500).json({
            success: false,
            message: "server error"
        });
}
}

// delete service
export async function deleteService(req, res){

    try {
        const { id } = req.params;
         const existing = await Service.findById(id);
       if(!existing) return res.status(404).json({
         success: false,
            message: "server Not Found"
       });
       if(existing.imagePublicId){
        try {
            await deleteFromCloudinary(existing.imagePublicId);
        } catch (err) {
            console.warn("Faild to delete image on cloudinary:", err?.message || err);
        }
       }

    await existing.deleteOne();
    return res.status(200).json({
        success: true,
        message: "Service Delete successfully"
    })


          } catch (err) {
        console.error("DeleteService  Error:", err);
        return res.status(500).json({
            success: false,
            message: "server error"
        });
}
}