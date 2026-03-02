import mongoose,{Schema} from "mongoose";

const meetingSchema= new Schema(
    {
        user_id:{type:String,required:true},
        meetingCode:{type:String},
        meetingcode:{type:String},
        date:{type:Date,default:Date.now,required:true}
    }
)

meetingSchema.pre("validate", function (next) {
    if (!this.meetingCode && this.meetingcode) {
        this.meetingCode = this.meetingcode;
    }

    if (!this.meetingcode && this.meetingCode) {
        this.meetingcode = this.meetingCode;
    }

    if (!this.meetingCode && !this.meetingcode) {
        this.invalidate("meetingCode", "Meeting code is required");
    }

    next();
});

const meeting =mongoose.model("meeting",meetingSchema);

export {meeting};