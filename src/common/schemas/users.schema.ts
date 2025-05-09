import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UsersDocument = Users & mongoose.Document;

@Schema({ timestamps: true, versionKey: '_v' })
export class Users {
  @Prop()
  wallet: string;

  @Prop()
  timezone: string;

  @Prop()
  point: number;

  @Prop()
  grade: string;

  @Prop()
  refreshToken: string;

  @Prop()
  updateShareAt: Date;

  @Prop()
  createdAt: Date;

  @Prop({ type: Object })
  nftHolder: {
    nftName: string;
    balance: number;
  }[];
}

export const UsersSchema = SchemaFactory.createForClass(Users);
