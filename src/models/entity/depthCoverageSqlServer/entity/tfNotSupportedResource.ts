import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('AMEClientTools_Coverage_Result_TFNotSupportedResources')
export class TfNotSupportedResource {
    @PrimaryColumn()
    fullResourceType: string;
    @Column({ nullable: true })
    fileName: string;
}
