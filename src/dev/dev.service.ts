import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from 'src/common/schemas/users.schema';

@Injectable()
export class DevService {
  constructor(
    @InjectModel('Users')
    private usersModel: Model<Users>,
  ) {}

  async deleteUser(userId: string) {
    const userInfo = await this.usersModel.findByIdAndDelete(userId);

    return userInfo;
  }
}
